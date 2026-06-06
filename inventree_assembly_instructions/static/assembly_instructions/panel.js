const VIDEO_EXTENSIONS = new Set(['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv']);

// Extract file extension from URL
function getExt(url) {
  const match = url.toLowerCase().match(/\.([a-z0-9]+)(\?|$)/);
  return match ? `.${match[1]}` : '';
}

//Basic Markdown to html converter
function markdownToHtml(md) {
  if (!md) return '';
  return md
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    // headings
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // bold / italic
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // inline code
    .replace(/`(.+?)`/g, '<code>$1</code>')
    // unordered list items
    .replace(/^\s*[-*] (.+)$/gm, '<li>$1</li>')
    // links
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
    // blank lines to paragraphs
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/\n/g, '<br>');
}

// Main function to render the panel content
export async function renderPanel(target, data) {
  if (!target) return;

  target.innerHTML = '<p style="padding:1rem">Loading assembly instructions…</p>';

  let attachments = [];
  let notes = '';

  try {
    const [attResp, partResp] = await Promise.all([
      fetch(`/api/attachment/?model_type=part&model_id=${data.id}`),
      fetch(`/api/part/${data.id}/`)
    ]);
    const attJson = await attResp.json();
    const partJson = await partResp.json();
    attachments = Array.isArray(attJson) ? attJson : (attJson.results ?? []);
    notes = partJson.notes || '';
  } catch (e) {
    target.innerHTML = '<p style="padding:1rem;color:red">Failed to load content.</p>';
    return;
  }

  const videos = attachments.filter(a => VIDEO_EXTENSIONS.has(getExt(a.attachment)));

  if (videos.length === 0 && !notes) {
    target.innerHTML = '<p style="padding:1rem">No instruction videos or notes found.</p>';
    return;
  }

  const parts = [];

  for (const v of videos) {
    parts.push(`
      <div style="margin-bottom:1.5rem">
        ${v.comment ? `<p style="font-weight:500;margin-bottom:0.5rem">${v.comment}</p>` : ''}
        <video controls style="width:100%;max-height:480px;background:#000;border-radius:4px">
          <source src="${v.attachment}">
          Your browser does not support the video tag.
        </video>
      </div>`);
  }

  if (notes) {
    parts.push(`
      <div style="margin-top:1rem;padding-top:1rem;border-top:1px solid #dee2e6;
                  line-height:1.6;font-size:0.95rem">
        <p>${markdownToHtml(notes)}</p>
      </div>`);
  }

  target.innerHTML = `<div style="padding:1rem">${parts.join('')}</div>`;
}

// Function to determine if the panel should be hidden based on context
export function isPanelHidden(context) {
  return !context?.id || context?.model !== 'part';
}
