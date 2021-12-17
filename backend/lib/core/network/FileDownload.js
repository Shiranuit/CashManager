const fs = require('fs');

class FileDownload {
  constructor(path, stream, size, chunkSize, {filename = 'filename', contentType} = {}){
    this.filename = filename;
    this.contentType = contentType;
    this.length = size;
    this.stream = stream;
    this.chunkSize = chunkSize;
    this.path = path;
  }

  async toJSON() {
    return {
      filename: this.filename,
      contentType: this.contentType,
      length: this.length,
      chunkSize: this.chunkSize,
      path: this.path
    }
  }

  static async Instantiate(path, {contentType, filename, chunkSize = 4 * 1024} = {}) {
    const stats = await fs.promises.stat(path);
    return new FileDownload(
      path,
      fs.createReadStream(
        path,
        {highWaterMark: chunkSize}
      ),
      stats.size,
      chunkSize,
      {contentType, filename, chunkSize}
    );
  }
};

module.exports = FileDownload;