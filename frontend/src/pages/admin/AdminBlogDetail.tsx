
import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, TextField, Button, CircularProgress } from '@mui/material';
import api from '../../api';
import { v4 as uuidv4 } from 'uuid';
import TOCEditor from '../../components/admin/TOCEditor';
import { Box as MuiBox } from '@mui/material';

const AdminBlogDetail: React.FC = () => {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editBuffer, setEditBuffer] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    // Use the admin listing endpoint to fetch full blog documents (including content and drafts)
    api.get('/blog/admin')
      .then(res => {
        let data = Array.isArray(res.data?.data) ? res.data.data : [];
        data = data.map((blog: any) => {
          const b = { ...blog, id: blog._id || blog.id };
          if (!b.uuid) b.uuid = uuidv4();
          return b;
        });
        setBlogs(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load blogs');
        setLoading(false);
      });
  }, []);

  // Helper: decode HTML entities (e.g. &lt;p&gt;) into real HTML string
  const decodeHtmlEntities = (html: string) => {
    if (!html || typeof html !== 'string') return '';
    try {
      const parsed = new DOMParser().parseFromString(html, 'text/html');
      // If the parsed document has body with textContent that contains tags, it was escaped
      const text = parsed.documentElement.textContent || '';
      // If text includes '<' and '>' then return text, otherwise return original
      if (text && /<[^>]+>/.test(text)) return text;
    } catch (e) {
      // ignore
    }
    return html;
  };

  // Parse an HTML content string into editor blocks (text/image/video/code)
  const parseContentToBlocks = (content: string) => {
    const blocks: any[] = [];
    if (!content || typeof content !== 'string') return blocks;
    const decoded = decodeHtmlEntities(content);
    let doc: Document;
    try {
      doc = new DOMParser().parseFromString(decoded, 'text/html');
    } catch (e) {
      // fallback to single text block
      return [{ type: 'text', content: decoded }];
    }
    const body = doc.body;
    if (!body) return [{ type: 'text', content: decoded }];

    // Iterate over child nodes and map to blocks
    body.childNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        const txt = node.textContent?.trim();
        if (txt) blocks.push({ type: 'text', content: txt });
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      const el = node as Element;
      const tag = el.tagName.toLowerCase();
      if (tag === 'p' || tag === 'div' || tag === 'section') {
        // Look for images inside
        const imgs = el.getElementsByTagName('img');
        if (imgs && imgs.length > 0) {
          Array.from(imgs).forEach(img => blocks.push({ type: 'image', url: img.getAttribute('src') || '' }));
          // Also capture any remaining text in paragraph
          const text = el.textContent?.replace(/\s+/g, ' ').trim();
          if (text && text.length > 0 && (!imgs || imgs.length === 0 || text !== '')) {
            // If there's text besides images, keep it as text block
            const cleaned = text;
            if (cleaned) blocks.unshift({ type: 'text', content: cleaned });
          }
          return;
        }
        // Check for iframe (video) inside
        const iframes = el.getElementsByTagName('iframe');
        if (iframes && iframes.length > 0) {
          Array.from(iframes).forEach(ifr => {
            const src = ifr.getAttribute('src') || '';
            blocks.push({ type: 'video', url: src });
          });
          return;
        }
        // No media inside: treat innerText as text block
        const pText = el.textContent?.trim();
        if (pText) blocks.push({ type: 'text', content: pText });
        return;
      }
      if (tag === 'img') {
        blocks.push({ type: 'image', url: el.getAttribute('src') || '' });
        return;
      }
      if (tag === 'iframe') {
        blocks.push({ type: 'video', url: el.getAttribute('src') || '' });
        return;
      }
      if (tag === 'pre') {
        const code = el.textContent || '';
        blocks.push({ type: 'code', code });
        return;
      }
      // Default: push element's text content
      const t = el.textContent?.trim();
      if (t) blocks.push({ type: 'text', content: t });
    });
    // If nothing parsed, fallback to single text block
    if (blocks.length === 0) return [{ type: 'text', content: decoded }];
    return blocks;
  };

  const handleEdit = (idx: number) => {
    setEditingIndex(idx);
    // Initialize contentBlocks from existing content: parse HTML into blocks so Edit shows media blocks instead of raw HTML
    const existing = { ...blogs[idx] };
    if (!Array.isArray(existing.contentBlocks)) {
      existing.contentBlocks = parseContentToBlocks(existing.content || '');
    }
    setEditBuffer(existing);
  };

  const handleChange = (field: string, value: any) => {
    setEditBuffer((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      // Helper: convert contentBlocks to HTML string so backend schema remains unchanged
      const escapeHtml = (str: string) => str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
      const convertBlocksToHTML = (blocks: any[]) => {
        if (!Array.isArray(blocks)) return '';
        return blocks.map(b => {
          if (!b || !b.type) return '';
          if (b.type === 'text') {
            const text = typeof b.content === 'string' ? b.content : '';
            return `<p>${escapeHtml(text).replace(/\n/g, '<br/>')}</p>`;
          }
          if (b.type === 'image') {
            const url = b.url || '';
            return `<p><img src="${escapeHtml(url)}" alt="image" style="max-width:100%;height:auto;"/></p>`;
          }
          if (b.type === 'video') {
            const url = b.url || '';
            // YouTube embed check
            const ytMatch = typeof url === 'string' && url.match(/(?:youtu.be\/|youtube.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([\w-]{11})/);
            if (ytMatch) {
              return `<div><iframe width=560 height=315 src="https://www.youtube.com/embed/${ytMatch[1]}" frameborder="0" allowfullscreen></iframe></div>`;
            }
            // Vimeo
            const vimeoMatch = typeof url === 'string' && url.match(/vimeo.com\/(\d+)/);
            if (vimeoMatch) {
              return `<div><iframe src="https://player.vimeo.com/video/${vimeoMatch[1]}" width=640 height=360 frameborder="0" allowfullscreen></iframe></div>`;
            }
            // fallback to video tag
            return `<video controls src="${escapeHtml(url)}" style="max-width:100%;height:auto;"></video>`;
          }
          if (b.type === 'code') {
            const code = typeof b.code === 'string' ? b.code : '';
            return `<pre><code>${escapeHtml(code)}</code></pre>`;
          }
          return '';
        }).join('\n');
      };
      // Normalize payload similar to main Admin Blogs tab
      const allowedCategories = ['technical', 'research', 'tutorial', 'insights', 'news'];
      const allowedStatus = ['draft', 'published', 'archived'];
      let payload: any = { ...editBuffer };
      // If contentBlocks present, convert to HTML string and set payload.content
      if (Array.isArray(payload.contentBlocks)) {
        payload.content = convertBlocksToHTML(payload.contentBlocks);
        // remove contentBlocks from payload to avoid sending extra data to backend
        delete payload.contentBlocks;
      }
      payload.uuid = payload.uuid || uuidv4();
      // Normalize tags: support tagsText editing field and fallback to tags string/array
      if (typeof payload.tagsText === 'string' && payload.tagsText.length > 0) {
        payload.tags = payload.tagsText.split(',').map((s: string) => s.trim()).filter(Boolean);
        delete payload.tagsText;
      } else if (typeof payload.tags === 'string') {
        payload.tags = payload.tags.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
      payload.tags = Array.isArray(payload.tags) ? payload.tags : [];
      // Slug normalize
      payload.slug = (payload.slug || '').toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '');
      // Publish date to ISO
      if (payload.publishedAt) {
        const d = new Date(payload.publishedAt);
        payload.publishedAt = !isNaN(d.getTime()) ? d.toISOString() : '';
      }
      payload.category = allowedCategories.includes(payload.category) ? payload.category : (payload.category || 'technical');
      payload.status = allowedStatus.includes(payload.status) ? payload.status : (payload.status || 'draft');
      payload.readTime = Math.max(1, Number(payload.readTime) || 1);
      payload.views = Number(payload.views) || 0;
      payload.likes = Number(payload.likes) || 0;

      delete payload.id;
      if (payload._id && (typeof payload._id !== 'string' || payload._id.length !== 24 || !/^[a-fA-F0-9]{24}$/.test(payload._id))) {
        delete payload._id;
      }
      let savedBlog: any = null;
      if (payload._id) {
        const res = await api.put(`/blog/${payload._id}`, payload);
        savedBlog = res.data?.data || res.data;
      } else {
        const res = await api.post('/blog', payload);
        savedBlog = res.data?.data || res.data;
      }
      const arr = [...blogs];
      arr[editingIndex!] = { ...arr[editingIndex!], ...savedBlog, id: savedBlog._id || savedBlog.id };
      setBlogs(arr);
      setEditingIndex(null);
      setEditBuffer({});
    } catch (e: any) {
      setError('Failed to save blog');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (idx: number) => {
    if (!window.confirm('Are you sure you want to delete this blog?')) return;
    try {
      const blog = blogs[idx];
      if (blog._id) await api.delete(`/blog/${blog._id}`);
      setBlogs(blogs.filter((_, i) => i !== idx));
      if (editingIndex === idx) {
        setEditingIndex(null);
        setEditBuffer({});
      }
    } catch {
      setError('Failed to delete blog');
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', mt: 4 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>Admin Blog Details</Typography>
      <Button
        variant="contained"
        color="primary"
        sx={{ mb: 3 }}
        onClick={() => {
          const newBlog = {
            title: '',
            author: '',
            publishedAt: '',
            slug: '',
            excerpt: '',
            content: '',
            toc: [],
            authorBio: '',
            tagsText: '',
            tags: [],
            category: 'technical',
            status: 'draft',
            featuredImage: '',
            readTime: 1,
            views: 0,
            likes: 0,
            uuid: uuidv4(),
            id: Date.now(),
          };
          setBlogs([newBlog, ...blogs]);
          setEditingIndex(0);
          setEditBuffer({ ...newBlog });
        }}
      >
        Add New Blog
      </Button>
      {blogs.length === 0 && <Typography>No blogs found.</Typography>}
      {blogs.map((blog, idx) => (
        <Paper key={blog.id || idx} sx={{ p: 3, mb: 3, position: 'relative' }}>
          {editingIndex === idx ? (
            <>
              <TextField label="Blog UUID" value={editBuffer.uuid || ''} fullWidth InputProps={{ readOnly: true }} sx={{ mb: 2 }} />
              <TextField label="Slug" value={editBuffer.slug || ''} onChange={e => handleChange('slug', e.target.value)} fullWidth sx={{ mb: 2 }} />
              <TextField label="Title" value={editBuffer.title || ''} onChange={e => handleChange('title', e.target.value)} fullWidth sx={{ mb: 2 }} />
              <TextField label="Author" value={editBuffer.author || ''} onChange={e => handleChange('author', e.target.value)} fullWidth sx={{ mb: 2 }} />
              <TextField label="Date" value={editBuffer.publishedAt || ''} onChange={e => handleChange('publishedAt', e.target.value)} fullWidth sx={{ mb: 2 }} />
              <TextField label="Excerpt" value={editBuffer.excerpt || ''} onChange={e => handleChange('excerpt', e.target.value)} fullWidth sx={{ mb: 2 }} />
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>Content (block editor)</Typography>
                {/* Block editor modeled after ProjectDetailsTab concept blocks */}
                {Array.isArray(editBuffer.contentBlocks) && editBuffer.contentBlocks.map((block: any, bIdx: number) => (
                  <MuiBox key={bIdx} sx={{ mb: 2, p: 1, border: '1px solid #e0e0e0', borderRadius: 1, background: '#fff' }}>
                    <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                      <Typography sx={{ fontWeight: 600 }}>{`Block ${bIdx + 1}`}</Typography>
                      <Button size="small" onClick={() => {
                        // move up
                        if (bIdx === 0) return;
                        const arr = Array.isArray(editBuffer.contentBlocks) ? [...editBuffer.contentBlocks] : [];
                        [arr[bIdx - 1], arr[bIdx]] = [arr[bIdx], arr[bIdx - 1]];
                        handleChange('contentBlocks', arr);
                      }}>Up</Button>
                      <Button size="small" onClick={() => {
                        // move down
                        const arr = Array.isArray(editBuffer.contentBlocks) ? [...editBuffer.contentBlocks] : [];
                        if (bIdx === arr.length - 1) return;
                        [arr[bIdx + 1], arr[bIdx]] = [arr[bIdx], arr[bIdx + 1]];
                        handleChange('contentBlocks', arr);
                      }}>Down</Button>
                      <Button size="small" color="error" onClick={() => {
                        const arr = Array.isArray(editBuffer.contentBlocks) ? [...editBuffer.contentBlocks] : [];
                        arr.splice(bIdx, 1);
                        handleChange('contentBlocks', arr);
                      }}>Remove</Button>
                    </Box>
                    {block.type === 'text' && (
                      <TextField
                        label="Text"
                        multiline
                        minRows={3}
                        fullWidth
                        value={block.content || ''}
                        onChange={e => {
                          const arr = Array.isArray(editBuffer.contentBlocks) ? [...editBuffer.contentBlocks] : [];
                          arr[bIdx] = { ...arr[bIdx], content: e.target.value };
                          handleChange('contentBlocks', arr);
                        }}
                      />
                    )}
                    {block.type === 'image' && (
                      <Box>
                        <TextField label="Image URL" fullWidth value={block.url || ''} onChange={e => {
                          const arr = Array.isArray(editBuffer.contentBlocks) ? [...editBuffer.contentBlocks] : [];
                          arr[bIdx] = { ...arr[bIdx], url: e.target.value };
                          handleChange('contentBlocks', arr);
                        }} />
                        {block.url ? <img src={block.url} alt="img" style={{ maxWidth: 320, maxHeight: 180, marginTop: 8, borderRadius: 6 }} onError={(e:any)=>{e.currentTarget.style.display='none'}} /> : null}
                      </Box>
                    )}
                    {block.type === 'video' && (
                      <Box>
                        <TextField label="Video URL (YouTube/Vimeo or direct file)" fullWidth value={block.url || ''} onChange={e => {
                          const arr = Array.isArray(editBuffer.contentBlocks) ? [...editBuffer.contentBlocks] : [];
                          arr[bIdx] = { ...arr[bIdx], url: e.target.value };
                          handleChange('contentBlocks', arr);
                        }} />
                        {block.url ? (
                          (typeof block.url === 'string' && (block.url.includes('youtube.com') || block.url.includes('youtu.be'))) ? (
                            (() => {
                              const ytMatch = (block.url || '').match(/(?:youtu.be\/|youtube.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([\w-]{11})/);
                              if (ytMatch) {
                                const videoId = ytMatch[1];
                                return <iframe title={`YouTube video ${videoId}`} width="320" height="180" src={`https://www.youtube.com/embed/${videoId}`} frameBorder="0" allowFullScreen style={{ borderRadius: 6, marginTop: 8 }} />;
                              }
                              return <video src={block.url} controls style={{ maxWidth: 320, maxHeight: 180, borderRadius: 6, marginTop: 8 }} />;
                            })()
                          ) : (
                            <video src={block.url} controls style={{ maxWidth: 320, maxHeight: 180, borderRadius: 6, marginTop: 8 }} />
                          )
                        ) : null}
                      </Box>
                    )}
                    {block.type === 'code' && (
                      <TextField label="Code" multiline minRows={6} fullWidth value={block.code || ''} onChange={e => {
                        const arr = Array.isArray(editBuffer.contentBlocks) ? [...editBuffer.contentBlocks] : [];
                        arr[bIdx] = { ...arr[bIdx], code: e.target.value };
                        handleChange('contentBlocks', arr);
                      }} />
                    )}
                  </MuiBox>
                ))}
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button size="small" onClick={() => {
                    const arr = Array.isArray(editBuffer.contentBlocks) ? [...editBuffer.contentBlocks] : [];
                    arr.push({ type: 'text', content: '' });
                    handleChange('contentBlocks', arr);
                  }}>Add Text</Button>
                  <Button size="small" onClick={() => {
                    const arr = Array.isArray(editBuffer.contentBlocks) ? [...editBuffer.contentBlocks] : [];
                    arr.push({ type: 'image', url: '' });
                    handleChange('contentBlocks', arr);
                  }}>Add Image</Button>
                  <Button size="small" onClick={() => {
                    const arr = Array.isArray(editBuffer.contentBlocks) ? [...editBuffer.contentBlocks] : [];
                    arr.push({ type: 'video', url: '' });
                    handleChange('contentBlocks', arr);
                  }}>Add Video</Button>
                  <Button size="small" onClick={() => {
                    const arr = Array.isArray(editBuffer.contentBlocks) ? [...editBuffer.contentBlocks] : [];
                    arr.push({ type: 'code', code: '' });
                    handleChange('contentBlocks', arr);
                  }}>Add Code</Button>
                </Box>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>Table of Contents</Typography>
                <TOCEditor items={Array.isArray(editBuffer.toc) ? editBuffer.toc : []} onChange={arr => handleChange('toc', arr)} />
              </Box>
              <TextField
                label="Tags (comma separated)"
                value={editBuffer.tagsText !== undefined ? editBuffer.tagsText : (Array.isArray(editBuffer.tags) ? editBuffer.tags.join(', ') : (editBuffer.tags || ''))}
                onChange={e => handleChange('tagsText', e.target.value)}
                placeholder="e.g. ai, healthcare, tutorial"
                fullWidth
                sx={{ mb: 2 }}
              />
              <TextField label="Category" value={editBuffer.category || 'technical'} onChange={e => handleChange('category', e.target.value)} fullWidth sx={{ mb: 2 }} />
              <TextField
                select
                label="Status"
                value={editBuffer.status || 'draft'}
                onChange={e => handleChange('status', e.target.value)}
                fullWidth
                sx={{ mb: 2 }}
                SelectProps={{ native: true }}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </TextField>
              <TextField label="Featured Image URL" value={editBuffer.featuredImage || ''} onChange={e => handleChange('featuredImage', e.target.value)} fullWidth sx={{ mb: 1 }} />
              {editBuffer.featuredImage ? (
                <Box sx={{ mb: 2 }}>
                  <img src={editBuffer.featuredImage} alt="Featured preview" style={{ width: 160, height: 90, objectFit: 'cover', borderRadius: 6, border: '1px solid #e0e0e0' }} onError={(e: any) => { e.currentTarget.style.display = 'none'; }} />
                </Box>
              ) : null}
              <TextField label="Read Time (minutes)" type="number" value={editBuffer.readTime || 1} onChange={e => handleChange('readTime', Number(e.target.value))} fullWidth sx={{ mb: 2 }} />
              <TextField
                label="Author Bio"
                value={editBuffer.authorBio || ''}
                onChange={e => handleChange('authorBio', e.target.value)}
                fullWidth
                multiline
                minRows={3}
                sx={{ mb: 2 }}
              />
              <TextField label="Views" type="number" value={editBuffer.views || ''} onChange={e => handleChange('views', Number(e.target.value))} fullWidth sx={{ mb: 2 }} />
              <TextField label="Likes" type="number" value={editBuffer.likes || ''} onChange={e => handleChange('likes', Number(e.target.value))} fullWidth sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button variant="contained" color="primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
                <Button variant="outlined" color="error" onClick={() => handleDelete(idx)}>Delete</Button>
                <Button variant="outlined" onClick={() => { setEditingIndex(null); setEditBuffer({}); }}>Cancel</Button>
              </Box>
            </>
          ) : (
            <>
              <TextField label="Blog UUID" value={blog.uuid || ''} fullWidth InputProps={{ readOnly: true }} sx={{ mb: 1 }} />
              <Typography variant="h6">{blog.title}</Typography>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>By {blog.author} | {blog.publishedAt ? new Date(blog.publishedAt).toLocaleDateString() : ''}</Typography>
              <Typography sx={{ mb: 1 }}>{blog.excerpt}</Typography>
              {/* Render content preview if available */}
              {Array.isArray(blog.contentBlocks) ? (
                <Box sx={{ mb: 2 }}>
                  {blog.contentBlocks.map((b: any, i: number) => (
                    <React.Fragment key={i}>
                      {b.type === 'text' && <Typography sx={{ whiteSpace: 'pre-line', mb: 1 }}>{b.content}</Typography>}
                      {b.type === 'image' && b.url && <img src={b.url} alt={`img-${i}`} style={{ maxWidth: '100%', maxHeight: 240, borderRadius: 6 }} onError={(e:any)=>{e.currentTarget.style.display='none'}} />}
                      {b.type === 'video' && b.url && (
                        (() => {
                          const url = b.url;
                          const ytMatch = typeof url === 'string' && url.match(/(?:youtu.be\/|youtube.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([\w-]{11})/);
                          if (ytMatch) {
                            const videoId = ytMatch[1];
                            return <iframe title={`YouTube video ${videoId}`} width="560" height="315" src={`https://www.youtube.com/embed/${videoId}`} frameBorder="0" allowFullScreen style={{ borderRadius: 6, marginTop: 8 }} />;
                          }
                          const vimeoMatch = typeof url === 'string' && url.match(/vimeo.com\/(\d+)/);
                          if (vimeoMatch) {
                            const vimeoId = vimeoMatch[1];
                            return <iframe title={`Vimeo video ${vimeoId}`} src={`https://player.vimeo.com/video/${vimeoId}`} width="640" height="360" frameBorder="0" allowFullScreen style={{ borderRadius: 6, marginTop: 8 }} />;
                          }
                          return <video src={url} controls style={{ maxWidth: 560, maxHeight: 315, borderRadius: 6, marginTop: 8 }} />;
                        })()
                      )}
                      {b.type === 'code' && <Box sx={{ background: '#f4f4f4', p: 1, borderRadius: 1, mb: 1 }}><pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}><code>{b.code}</code></pre></Box>}
                    </React.Fragment>
                  ))}
                </Box>
              ) : blog.content ? (
                <Box sx={{ mb: 2 }}>
                  {(() => {
                    const contentStr = typeof blog.content === 'string' ? blog.content : '';
                    // Helper to detect if content appears to be escaped HTML entities like &lt;p&gt;
                    const looksEscaped = contentStr.includes('&lt;') || contentStr.includes('&gt;');
                    let decoded = contentStr;
                    if (looksEscaped && typeof window !== 'undefined' && window.document) {
                      // Use DOM parsing in browser to decode HTML entities safely
                      try {
                        const parsed = new DOMParser().parseFromString(contentStr, 'text/html');
                        decoded = parsed.documentElement.textContent || contentStr;
                      } catch (err) {
                        decoded = contentStr;
                      }
                    }
                    if (/<\/?[a-z][\s\S]*>/i.test(decoded)) {
                      return <div dangerouslySetInnerHTML={{ __html: decoded }} />;
                    }
                    return <Typography sx={{ whiteSpace: 'pre-line' }}>{decoded}</Typography>;
                  })()}
                </Box>
              ) : null}
              {/* Table of contents preview */}
              {(blog.toc && Array.isArray(blog.toc) && blog.toc.length > 0) ? (
                <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>Table of Contents</Typography>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {blog.toc.map((item: string) => (
                      <li key={item} style={{ marginBottom: 4 }}>{item}</li>
                    ))}
                  </ul>
                </Paper>
              ) : null}
              {/* Author bio */}
              {blog.authorBio ? (
                <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>About the Author</Typography>
                  <Typography variant="body2">{blog.authorBio}</Typography>
                </Paper>
              ) : null}
              {/* Featured image preview */}
              {blog.featuredImage ? (
                <Box sx={{ mb: 2 }}>
                  <img src={blog.featuredImage} alt="preview" style={{ width: 160, height: 90, objectFit: 'cover', borderRadius: 6, border: '1px solid #e0e0e0' }} onError={(e: any) => { e.currentTarget.style.display = 'none'; }} />
                </Box>
              ) : null}
              <Button variant="outlined" onClick={() => handleEdit(idx)} sx={{ mr: 2, color: "white" }}>Edit</Button>
              <Button variant="outlined" 
            //   color="error" 
              onClick={() => handleDelete(idx)} sx={{color: "white" }}>Delete</Button>
            </>
          )}
        </Paper>
      ))}
    </Box>
  );
};

export default AdminBlogDetail;
