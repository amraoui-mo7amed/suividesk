const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const REPO_OWNER = 'amraoui-mo7amed';
const REPO_NAME = 'suividesk';
const TAG = 'v1.4.0';

function getAuthToken() {
  try {
    return execSync('gh auth token', { encoding: 'utf8' }).trim();
  } catch (err) {
    console.error('Error getting gh auth token:', err.message);
    process.exit(1);
  }
}

function httpsRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(data ? JSON.parse(data) : {});
          } catch {
            resolve(data);
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function getRelease(token) {
  const options = {
    hostname: 'api.github.com',
    path: `/repos/${REPO_OWNER}/${REPO_NAME}/releases/tags/${TAG}`,
    method: 'GET',
    headers: {
      'User-Agent': 'SuiviDesk-Uploader',
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  };
  return httpsRequest(options);
}

async function deleteAsset(token, assetId) {
  const options = {
    hostname: 'api.github.com',
    path: `/repos/${REPO_OWNER}/${REPO_NAME}/releases/assets/${assetId}`,
    method: 'DELETE',
    headers: {
      'User-Agent': 'SuiviDesk-Uploader',
      'Authorization': `Bearer ${token}`
    }
  };
  return httpsRequest(options);
}

function uploadAssetWithProgress(token, releaseId, filePath) {
  return new Promise((resolve, reject) => {
    const fileName = path.basename(filePath);
    const stat = fs.statSync(filePath);
    const totalBytes = stat.size;

    console.log(`\n========================================`);
    console.log(`🚀 Starting upload: ${fileName} (${(totalBytes / 1024 / 1024).toFixed(1)} MB)`);
    console.log(`========================================`);

    const options = {
      hostname: 'uploads.github.com',
      path: `/repos/${REPO_OWNER}/${REPO_NAME}/releases/${releaseId}/assets?name=${encodeURIComponent(fileName)}`,
      method: 'POST',
      headers: {
        'User-Agent': 'SuiviDesk-Uploader',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/octet-stream',
        'Content-Length': totalBytes
      }
    };

    let uploadedBytes = 0;
    const startTime = Date.now();
    let lastLogTime = Date.now();

    const req = https.request(options, (res) => {
      let respData = '';
      res.on('data', (c) => { respData += c; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1);
          console.log(`✅ [${fileName}] Upload completed in ${totalDuration}s!`);
          resolve();
        } else {
          reject(new Error(`Failed to upload ${fileName}: HTTP ${res.statusCode} - ${respData}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    const fileStream = fs.createReadStream(filePath, { highWaterMark: 64 * 1024 });

    fileStream.on('data', (chunk) => {
      uploadedBytes += chunk.length;
      const now = Date.now();
      if (now - lastLogTime >= 3000 || uploadedBytes === totalBytes) {
        const percent = ((uploadedBytes / totalBytes) * 100).toFixed(1);
        const elapsedSec = (now - startTime) / 1000;
        const speedMBps = elapsedSec > 0 ? ((uploadedBytes / 1024 / 1024) / elapsedSec).toFixed(2) : '0';
        const remainingBytes = totalBytes - uploadedBytes;
        const etaSec = speedMBps > 0 ? Math.round((remainingBytes / 1024 / 1024) / speedMBps) : '—';

        console.log(`⏳ [${fileName}] ${percent}% | ${(uploadedBytes / 1024 / 1024).toFixed(1)} MB / ${(totalBytes / 1024 / 1024).toFixed(1)} MB | ${speedMBps} MB/s | ETA: ${etaSec}s`);
        lastLogTime = now;
      }
    });

    fileStream.pipe(req);
  });
}

async function main() {
  const token = getAuthToken();
  console.log('Fetching release info...');
  const release = await getRelease(token);
  console.log(`Found release ${release.name} (ID: ${release.id})`);

  // Target files in order of priority:
  // 1. x64 installer (primary for 99% of users)
  // 2. MSI installer
  // 3. ARM64 installer
  const files = [
    path.join(__dirname, '..', 'release', 'SuiviDesk-Setup-1.4.0-x64.exe'),
    path.join(__dirname, '..', 'release', 'SuiviDesk-Installer-1.4.0-x64.msi'),
    path.join(__dirname, '..', 'release', 'SuiviDesk-Setup-1.4.0-arm64.exe')
  ];

  for (const filePath of files) {
    if (!fs.existsSync(filePath)) {
      console.warn(`File not found: ${filePath}, skipping.`);
      continue;
    }

    const fileName = path.basename(filePath);
    // Check if an asset with this name already exists and delete it
    const existing = (release.assets || []).find((a) => a.name === fileName);
    if (existing) {
      console.log(`Deleting existing asset ${fileName} (ID: ${existing.id})...`);
      await deleteAsset(token, existing.id);
      console.log(`Deleted existing asset ${fileName}`);
    }

    await uploadAssetWithProgress(token, release.id, filePath);
  }

  console.log('\n🎉 ALL ASSETS SUCCESSFULLY UPLOADED TO v1.4.0!');
}

main().catch((err) => {
  console.error('\n❌ Upload failed:', err.message);
  process.exit(1);
});
