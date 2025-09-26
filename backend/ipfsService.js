const { create } = require('ipfs-http-client');
const fs = require('fs');
const path = require('path');

class IPFSService {
  constructor() {
    // Generate Infura auth if credentials are provided
    let auth = '';
    if (process.env.IPFS_PROJECT_ID && process.env.IPFS_PROJECT_SECRET) {
      auth = 'Basic ' + Buffer.from(
        process.env.IPFS_PROJECT_ID + ':' + process.env.IPFS_PROJECT_SECRET
      ).toString('base64');
    }

    // Connect to IPFS node (you can use Infura, local node, or other providers)
    this.ipfs = create({
      host: process.env.IPFS_HOST || 'ipfs.infura.io',
      port: process.env.IPFS_PORT || 5001,
      protocol: process.env.IPFS_PROTOCOL || 'https',
      headers: auth ? { authorization: auth } : {}
    });

    console.log('IPFS Service initialized');
    
    // Test connection
    this.checkConnection().catch(err => {
      console.warn('IPFS connection test failed, will fallback to local storage:', err.message);
    });
  }

  // Upload file to IPFS
  async uploadFile(filePath, metadata = {}) {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const fileName = path.basename(filePath);

      // Create file object with metadata
      const fileObject = {
        path: fileName,
        content: fileBuffer,
        ...metadata
      };

      // Add file to IPFS
      const result = await this.ipfs.add(fileObject);
      
      console.log(`File uploaded to IPFS: ${result.cid.toString()}`);
      
      return {
        hash: result.cid.toString(),
        path: result.path,
        size: result.size,
        url: `https://ipfs.io/ipfs/${result.cid.toString()}`
      };

    } catch (error) {
      console.error('Error uploading to IPFS:', error);
      throw error;
    }
  }

  // Upload JSON data to IPFS
  async uploadJSON(data) {
    try {
      const jsonString = JSON.stringify(data, null, 2);
      const result = await this.ipfs.add(jsonString);
      
      console.log(`JSON uploaded to IPFS: ${result.cid.toString()}`);
      
      return {
        hash: result.cid.toString(),
        url: `https://ipfs.io/ipfs/${result.cid.toString()}`,
        data
      };

    } catch (error) {
      console.error('Error uploading JSON to IPFS:', error);
      throw error;
    }
  }

  // Upload batch metadata to IPFS
  async uploadBatchMetadata(batchData, photoPath = null, qualityReportPath = null) {
    try {
      const metadata = {
        batchNumber: batchData.batchNumber,
        produce: batchData.produce,
        variety: batchData.variety,
        quantity: batchData.quantity,
        qualityGrade: batchData.qualityGrade,
        isOrganic: batchData.isOrganic,
        farmLocation: batchData.farmLocation,
        gpsCoordinates: batchData.gpsCoordinates,
        harvestDate: new Date().toISOString(),
        farmer: {
          name: batchData.farmerName,
          location: batchData.farmLocation
        },
        files: {}
      };

      // Upload photo if provided
      if (photoPath && fs.existsSync(photoPath)) {
        const photoResult = await this.uploadFile(photoPath, {
          type: 'product_photo',
          description: 'Product photo taken at harvest'
        });
        metadata.files.photo = photoResult;
      }

      // Upload quality report if provided
      if (qualityReportPath && fs.existsSync(qualityReportPath)) {
        const reportResult = await this.uploadFile(qualityReportPath, {
          type: 'quality_report',
          description: 'Quality assessment report'
        });
        metadata.files.qualityReport = reportResult;
      }

      // Upload the complete metadata
      const metadataResult = await this.uploadJSON(metadata);
      
      return {
        metadataHash: metadataResult.hash,
        metadataUrl: metadataResult.url,
        photoHash: metadata.files.photo?.hash,
        qualityReportHash: metadata.files.qualityReport?.hash,
        metadata
      };

    } catch (error) {
      console.error('Error uploading batch metadata to IPFS:', error);
      throw error;
    }
  }

  // Upload handoff event to IPFS
  async uploadHandoffEvent(handoffData, photoPath = null, documentPath = null) {
    try {
      const eventMetadata = {
        eventType: handoffData.eventType,
        timestamp: new Date().toISOString(),
        location: handoffData.location,
        gpsCoordinates: handoffData.gpsCoordinates,
        temperature: handoffData.temperature,
        notes: handoffData.notes,
        from: {
          name: handoffData.fromName,
          role: handoffData.fromRole
        },
        to: {
          name: handoffData.toName,
          role: handoffData.toRole
        },
        files: {}
      };

      // Upload photo if provided
      if (photoPath && fs.existsSync(photoPath)) {
        const photoResult = await this.uploadFile(photoPath, {
          type: 'handoff_photo',
          description: `Photo taken during ${handoffData.eventType}`
        });
        eventMetadata.files.photo = photoResult;
      }

      // Upload document if provided
      if (documentPath && fs.existsSync(documentPath)) {
        const docResult = await this.uploadFile(documentPath, {
          type: 'handoff_document',
          description: `Document for ${handoffData.eventType}`
        });
        eventMetadata.files.document = docResult;
      }

      // Upload the complete event metadata
      const eventResult = await this.uploadJSON(eventMetadata);
      
      return {
        eventHash: eventResult.hash,
        eventUrl: eventResult.url,
        photoHash: eventMetadata.files.photo?.hash,
        documentHash: eventMetadata.files.document?.hash,
        metadata: eventMetadata
      };

    } catch (error) {
      console.error('Error uploading handoff event to IPFS:', error);
      throw error;
    }
  }

  // Retrieve data from IPFS
  async getData(hash) {
    try {
      const chunks = [];
      for await (const chunk of this.ipfs.cat(hash)) {
        chunks.push(chunk);
      }
      
      const data = Buffer.concat(chunks).toString();
      
      try {
        return JSON.parse(data);
      } catch {
        return data; // Return as string if not JSON
      }

    } catch (error) {
      console.error('Error retrieving from IPFS:', error);
      throw error;
    }
  }

  // Pin content to ensure it stays available
  async pinContent(hash) {
    try {
      await this.ipfs.pin.add(hash);
      console.log(`Content pinned: ${hash}`);
      return true;
    } catch (error) {
      console.error('Error pinning content:', error);
      return false;
    }
  }

  // Generate IPFS gateway URL
  getGatewayUrl(hash, gateway = 'https://ipfs.io/ipfs/') {
    return `${gateway}${hash}`;
  }

  // Check if IPFS node is accessible
  async checkConnection() {
    try {
      const nodeId = await this.ipfs.id();
      console.log('IPFS node connected:', nodeId.id);
      return true;
    } catch (error) {
      console.error('IPFS connection failed:', error);
      return false;
    }
  }
}

module.exports = IPFSService;