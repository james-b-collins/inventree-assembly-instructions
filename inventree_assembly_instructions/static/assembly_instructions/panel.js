const VIDEO_EXTENSIONS = new Set(['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv']);

// Extract file extension from URL
function getExt(url) {
  const match = url.toLowerCase().match(/\.([a-z0-9]+)(\?|$)/);
  return match ? `.${match[1]}` : '';
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
        ${notes}
      </div>`);
  }

  target.innerHTML = `<div style="padding:1rem">${parts.join('')}</div>`;

  // Convert any raw markdown image syntax left inside the rendered HTML
  target.innerHTML = target.innerHTML.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    '<img src="$2" alt="$1" style="max-width:100%;border-radius:4px">'
  );
}

// Function to determine if the panel should be hidden based on context
export function isPanelHidden(context) {
  return !context?.id || context?.model !== 'part';
}
