const REPO = process.env.GITHUB_REPO || 'kng3750/marine';
const BRANCH = process.env.GITHUB_BRANCH || 'main';
const DATA_PATH = 'data/careers.json';

function githubHeaders() {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'mariner-path-admin',
    'X-GitHub-Api-Version': '2022-11-28'
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return headers;
}

async function readGithubData() {
  const url = `https://api.github.com/repos/${REPO}/contents/${DATA_PATH}?ref=${encodeURIComponent(BRANCH)}`;
  const response = await fetch(url, { headers: githubHeaders(), cache: 'no-store' });
  if (response.status === 404) return { careers: null, sha: null };
  if (!response.ok) throw new Error(`GitHub read failed (${response.status})`);
  const file = await response.json();
  const text = Buffer.from(file.content.replace(/\n/g, ''), 'base64').toString('utf8');
  return { careers: JSON.parse(text), sha: file.sha };
}

function send(response, status, data) {
  response.status(status).setHeader('Cache-Control', 'no-store, max-age=0');
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(data));
}

module.exports = async function handler(request, response) {
  try {
    if (request.method === 'GET') {
      const stored = await readGithubData();
      return send(response, 200, {
        careers: stored.careers,
        persistent: Boolean(process.env.GITHUB_TOKEN && process.env.ADMIN_PASSWORD)
      });
    }

    if (request.method !== 'POST') {
      response.setHeader('Allow', 'GET, POST');
      return send(response, 405, { error: '허용되지 않은 요청입니다.' });
    }

    if (!process.env.GITHUB_TOKEN || !process.env.ADMIN_PASSWORD) {
      return send(response, 503, { error: '영구 저장 환경변수가 설정되지 않았습니다.' });
    }

    const authorization = request.headers.authorization || '';
    if (authorization !== `Bearer ${process.env.ADMIN_PASSWORD}`) {
      return send(response, 401, { error: '관리자 비밀번호가 올바르지 않습니다.' });
    }

    const careers = request.body?.careers;
    if (!Array.isArray(careers) || careers.length > 500 || !careers.every(item => item?.id && item?.name && item?.field)) {
      return send(response, 400, { error: '저장할 진로 데이터 형식이 올바르지 않습니다.' });
    }

    const current = await readGithubData();
    const body = {
      message: `Update career content (${new Date().toISOString().slice(0, 10)})`,
      content: Buffer.from(`${JSON.stringify(careers, null, 2)}\n`, 'utf8').toString('base64'),
      branch: BRANCH
    };
    if (current.sha) body.sha = current.sha;

    const url = `https://api.github.com/repos/${REPO}/contents/${DATA_PATH}`;
    const saved = await fetch(url, {
      method: 'PUT',
      headers: { ...githubHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!saved.ok) {
      const detail = await saved.json().catch(() => ({}));
      throw new Error(detail.message || `GitHub write failed (${saved.status})`);
    }
    const result = await saved.json();
    return send(response, 200, { ok: true, commit: result.commit?.sha });
  } catch (error) {
    console.error('[api/careers] request failed', { message: String(error?.message || error) });
    return send(response, 500, { error: '영구 저장 중 오류가 발생했습니다.' });
  }
};
