const VIDEO_EXTENSIONS = new Set(['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv']);

function getExt(url) {
  const match = url.toLowerCase().match(/\.([a-z0-9]+)(\?|$)/);
  return match ? `.${match[1]}` : '';
}

function getCsrfToken() {
  const match = document.cookie.match(/csrftoken=([^;]+)/);
  return match ? match[1] : '';
}

async function loadContent(target, partId) {
  let attachments = [];
  let notes = '';

  try {
    const [attResp, partResp] = await Promise.all([
      fetch(`/api/attachment/?model_type=part&model_id=${partId}`),
      fetch(`/api/part/${partId}/`),
    ]);
    const attJson  = await attResp.json();
    const partJson = await partResp.json();
    attachments = Array.isArray(attJson) ? attJson : (attJson.results ?? []);
    notes = partJson.notes || '';
  } catch (e) {
    target.innerHTML = '<p style="padding:1rem;color:red">Failed to load content.</p>';
    return;
  }

  const videos = attachments.filter(a => VIDEO_EXTENSIONS.has(getExt(a.attachment)));
  const parts  = [];

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

  if (parts.length === 0) {
    parts.push('<p style="color:#868e96">No instruction videos or notes found.</p>');
  }

  // Upload section
  parts.push(`
    <div style="margin-top:1.5rem;padding-top:1rem;border-top:1px solid #dee2e6">
      <p style="font-weight:500;margin-bottom:0.5rem">Upload instruction video</p>
      <div id="asm-drop-zone" style="
        border:2px dashed #ced4da;border-radius:6px;padding:1.5rem;text-align:center;
        color:#868e96;cursor:pointer;transition:border-color 0.2s">
        <p style="margin:0">Drag &amp; drop a video file here, or <label for="asm-file-input" style="color:#1c7ed6;cursor:pointer;text-decoration:underline">browse</label></p>
        <input id="asm-file-input" type="file" accept="video/*" style="display:none">
      </div>
      <div id="asm-progress-wrap" style="display:none;margin-top:0.75rem">
        <div style="background:#e9ecef;border-radius:4px;height:8px;overflow:hidden">
          <div id="asm-progress-bar" style="height:100%;width:0%;background:#1c7ed6;transition:width 0.1s ease"></div>
        </div>
        <p id="asm-progress-label" style="margin:0.25rem 0 0;font-size:0.85rem;color:#495057"></p>
      </div>
      <div id="asm-upload-status" style="margin-top:0.5rem;font-size:0.9rem"></div>
    </div>`);

  target.innerHTML = `<div style="padding:1rem">${parts.join('')}</div>`;

  // Fix markdown images in notes
  target.innerHTML = target.innerHTML.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    '<img src="$2" alt="$1" style="max-width:100%;border-radius:4px">'
  );

  // Wire up upload
  const dropZone   = target.querySelector('#asm-drop-zone');
  const fileInput  = target.querySelector('#asm-file-input');
  const statusEl   = target.querySelector('#asm-upload-status');

  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) uploadFile(fileInput.files[0], partId, statusEl, target);
    fileInput.value = '';
  });

  dropZone.addEventListener('click', () => fileInput.click());

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = '#1c7ed6';
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.style.borderColor = '#ced4da';
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = '#ced4da';
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file, partId, statusEl, target);
  });
}

function uploadFile(file, partId, statusEl, target) {
  const progressWrap  = target.querySelector('#asm-progress-wrap');
  const progressBar   = target.querySelector('#asm-progress-bar');
  const progressLabel = target.querySelector('#asm-progress-label');

  statusEl.textContent = '';
  progressWrap.style.display = 'block';
  progressBar.style.width = '0%';
  progressLabel.textContent = `Uploading ${file.name}…`;

  const form = new FormData();
  form.append('model_type', 'part');
  form.append('model_id', String(parseInt(partId, 10)));
  form.append('attachment', file);

  const xhr = new XMLHttpRequest();

  xhr.upload.addEventListener('progress', (e) => {
    if (!e.lengthComputable) return;
    const pct = Math.round((e.loaded / e.total) * 100);
    progressBar.style.width = `${pct}%`;
    progressLabel.textContent = `${pct}% — ${(e.loaded / 1024 / 1024).toFixed(1)} / ${(e.total / 1024 / 1024).toFixed(1)} MB`;
  });

  xhr.addEventListener('load', () => {
    progressWrap.style.display = 'none';
    if (xhr.status >= 200 && xhr.status < 300) {
      statusEl.style.color = 'green';
      statusEl.textContent = `${file.name} uploaded successfully. Reloading…`;
      setTimeout(() => loadContent(target, partId), 1000);
    } else {
      let detail = '';
      try { detail = JSON.stringify(JSON.parse(xhr.responseText)); } catch { detail = xhr.statusText; }
      statusEl.style.color = 'red';
      statusEl.textContent = `Upload failed (${xhr.status}): ${detail}`;
    }
  });

  xhr.addEventListener('error', () => {
    progressWrap.style.display = 'none';
    statusEl.style.color = 'red';
    statusEl.textContent = 'Upload error: network failure.';
  });

  xhr.open('POST', '/api/attachment/');
  xhr.setRequestHeader('X-CSRFToken', getCsrfToken());
  xhr.send(form);
}

export async function renderPanel(target, data) {
  if (!target) return;
  target.innerHTML = '<p style="padding:1rem">Loading assembly instructions…</p>';
  await loadContent(target, data.id);
}

export function isPanelHidden(context) {
  return !context?.id || context?.model !== 'part';
}
