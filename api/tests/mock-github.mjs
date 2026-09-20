// mock-github.mjs — จำลอง GitHub REST API (Contents + Git Data) แบบ in-memory
// ใช้ทดสอบ logic ของ api/worker.js จริง ๆ โดยไม่ต้องมีเครือข่าย/repo จริง
export function createMockGitHub(initialFiles) {
  let blobSeq = 1, treeSeq = 1, commitSeq = 1;
  const blobs = new Map();   // blobSha -> raw content string ตามที่เก็บจริง (utf8 text หรือ base64 สำหรับไบนารี)
  const trees = new Map();   // treeSha -> Map(path -> blobSha)  (flattened snapshot)
  const commits = new Map(); // commitSha -> { treeSha, parentSha }

  const rootTree = new Map();
  for (const [path, content] of Object.entries(initialFiles)) {
    const bSha = "blob" + (blobSeq++);
    blobs.set(bSha, content);
    rootTree.set(path, bSha);
  }
  const rootTreeSha = "tree" + (treeSeq++);
  trees.set(rootTreeSha, rootTree);
  const rootCommitSha = "commit" + (commitSeq++);
  commits.set(rootCommitSha, { treeSha: rootTreeSha, parentSha: null });

  const state = {
    branchSha: rootCommitSha,
    forceConflictOnNextRefUpdate: false,
    forceFailOnNextCommitCreate: false, // จำลอง GitHub ล่ม/error ตอนสร้าง commit object (ทดสอบข้อ 5: ต้องไม่ถือว่าบันทึกสำเร็จ)
    calls: []
  };

  function currentFileSha(path) {
    const tree = trees.get(commits.get(state.branchSha).treeSha);
    return tree.get(path) || null;
  }

  async function mockFetch(url, init = {}) {
    const u = new URL(url);
    state.calls.push(u.pathname + (init.method ? " " + init.method : " GET"));
    const method = init.method || "GET";
    const body = init.body ? JSON.parse(init.body) : null;

    // GET /contents/{path}?ref=...
    let m = /^\/repos\/[^/]+\/[^/]+\/contents\/(.+)$/.exec(u.pathname);
    if (m && method === "GET") {
      const path = decodeURIComponent(m[1]);
      const sha = currentFileSha(path);
      if (!sha) return jsonRes(404, { message: "Not Found" });
      // ไฟล์ text เก็บเป็น utf8 string ภายใน mock นี้ ต้อง encode เป็น base64 ตอนตอบกลับเหมือน Contents API จริง
      // ไฟล์ binary (เช่นรูปภาพที่มาจาก /git/blobs แบบ encoding=base64) เก็บเป็น base64 string อยู่แล้ว
      const raw = blobs.get(sha);
      const asBase64 = looksLikeBase64Image(path) ? raw : Buffer.from(raw, "utf8").toString("base64");
      return jsonRes(200, { content: asBase64, sha });
    }
    // GET /git/ref/heads/{branch}
    if (/^\/repos\/[^/]+\/[^/]+\/git\/ref\/heads\//.test(u.pathname) && method === "GET") {
      return jsonRes(200, { object: { sha: state.branchSha } });
    }
    // GET /git/commits/{sha}
    m = /^\/repos\/[^/]+\/[^/]+\/git\/commits\/([^/]+)$/.exec(u.pathname);
    if (m && method === "GET") {
      const c = commits.get(m[1]);
      if (!c) return jsonRes(404, {});
      return jsonRes(200, { tree: { sha: c.treeSha } });
    }
    // POST /git/blobs
    if (/^\/repos\/[^/]+\/[^/]+\/git\/blobs$/.test(u.pathname) && method === "POST") {
      const bSha = "blob" + (blobSeq++);
      // เก็บ "ตามที่ส่งมาจริง": ถ้า encoding=base64 และเนื้อหาเป็น JSON/utf8 (เริ่มด้วย "{"/"["/etc หลัง decode
      // ได้ utf8 ที่ valid) ให้เก็บแบบ decode ไว้เพื่อให้ readFile() อ่านง่าย ๆ ส่วนไบนารีจริง (รูปภาพ) จะ decode
      // ไม่ได้เป็น utf8 ที่ valid หรือมีไบต์แปลก ๆ จึงเก็บ base64 ดิบไว้แทน (ตรงกับพฤติกรรม Git blob binary จริง)
      const decoded = tryDecodeUtf8Base64(body.content);
      blobs.set(bSha, decoded !== null ? decoded : body.content);
      return jsonRes(201, { sha: bSha });
    }
    // POST /git/trees
    if (/^\/repos\/[^/]+\/[^/]+\/git\/trees$/.test(u.pathname) && method === "POST") {
      const base = trees.get(body.base_tree) || new Map();
      const nt = new Map(base);
      for (const item of body.tree) nt.set(item.path, item.sha);
      const treeSha = "tree" + (treeSeq++);
      trees.set(treeSha, nt);
      return jsonRes(201, { sha: treeSha });
    }
    // POST /git/commits
    if (/^\/repos\/[^/]+\/[^/]+\/git\/commits$/.test(u.pathname) && method === "POST") {
      if (state.forceFailOnNextCommitCreate) {
        state.forceFailOnNextCommitCreate = false;
        return jsonRes(500, { message: "mock: simulated GitHub outage creating commit object" });
      }
      const commitSha = "commit" + (commitSeq++);
      commits.set(commitSha, { treeSha: body.tree, parentSha: (body.parents || [])[0] || null });
      return jsonRes(201, { sha: commitSha });
    }
    // PATCH /git/refs/heads/{branch}
    if (/^\/repos\/[^/]+\/[^/]+\/git\/refs\/heads\//.test(u.pathname) && method === "PATCH") {
      if (state.forceConflictOnNextRefUpdate) {
        state.forceConflictOnNextRefUpdate = false;
        return jsonRes(422, { message: "Update is not a fast forward" });
      }
      state.branchSha = body.sha;
      return jsonRes(200, { object: { sha: body.sha } });
    }

    return jsonRes(404, { message: "mock: unhandled route " + method + " " + u.pathname });
  }

  function looksLikeBase64Image(path) { return /^assets\/img\/uploads\//.test(path); }
  function tryDecodeUtf8Base64(b64) {
    try {
      const buf = Buffer.from(b64, "base64");
      const text = buf.toString("utf8");
      const reencoded = Buffer.from(text, "utf8").toString("base64");
      return reencoded === b64 ? text : null;
    } catch { return null; }
  }

  function jsonRes(status, obj) {
    return new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });
  }

  return {
    fetch: mockFetch,
    state,
    readFile: path => { const sha = currentFileSha(path); return sha ? blobs.get(sha) : null; },
    // สำหรับรูปภาพ: คืน sha ปัจจุบันของไฟล์ที่ path นั้น (null ถ้ายังไม่มี) — ใช้เช็คว่ามีการสร้างไฟล์จริงหรือไม่
    fileExists: path => currentFileSha(path) !== null,
    countCalls: pattern => state.calls.filter(c => c.includes(pattern)).length
  };
}

