export const uploadToDrive = async (
  accessToken: string,
  fileName: string,
  content: Blob,
  mimeType: string = 'application/pdf',
  folderId?: string
) => {
  const metadata: any = {
    name: fileName,
    mimeType: mimeType,
  };

  if (folderId && folderId !== 'root') {
    metadata.parents = [folderId];
  }

  const formData = new FormData();
  formData.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  );
  formData.append('file', content);

  try {
    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Gagal mengunggah ke Google Drive');
    }

    return await response.json();
  } catch (error) {
    console.error('Drive upload error:', error);
    throw error;
  }
};

export const createDriveFolder = async (accessToken: string, folderName: string, parentId?: string) => {
  const metadata: any = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };

  if (parentId && parentId !== 'root') {
    metadata.parents = [parentId];
  }

  try {
    const response = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata),
    });

    if (!response.ok) {
      throw new Error('Gagal membuat folder di Google Drive');
    }

    return await response.json();
  } catch (error) {
    console.error('Drive folder error:', error);
    throw error;
  }
};

export const listDriveFiles = async (accessToken: string, query: string = "trashed = false") => {
  try {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id, name, mimeType, thumbnailLink, webViewLink, webContentLink, iconLink, createdTime, modifiedTime, size, description)&pageSize=20`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Gagal mengambil daftar file dari Google Drive');
    }

    const data = await response.json();
    return data.files || [];
  } catch (error) {
    console.error('Drive list error:', error);
    throw error;
  }
};

export const deleteDriveFile = async (accessToken: string, fileId: string) => {
  try {
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Gagal menghapus file di Google Drive');
    }

    return true;
  } catch (error) {
    console.error('Drive delete error:', error);
    throw error;
  }
};

export const getDriveFileBlob = async (accessToken: string, fileId: string) => {
  try {
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Gagal mengunduh isi file dari Google Drive');
    }

    return await response.blob();
  } catch (error) {
    console.error('Drive fetch blob error:', error);
    throw error;
  }
};
