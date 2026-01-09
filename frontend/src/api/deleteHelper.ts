import api from '.';

export default async function safeDelete(path: string, config: any = { withCredentials: true }) {
  try {
    const res = await api.delete(path, config);
    const data = res.data;
    const ok = (data && (data.success === true || typeof data.message === 'string')) || res.status === 200;
    if (!ok) {
      const errMsg = data?.error || data?.message || `Failed to delete resource at ${path}`;
      const error: any = new Error(String(errMsg));
      error.response = { data, status: res.status };
      throw error;
    }
    return data;
  } catch (err) {
    throw err;
  }
}
