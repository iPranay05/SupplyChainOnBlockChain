const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

class PinataService {
  constructor() {
    this.apiKey = process.env.PINATA_API_KEY;
    this.secretApiKey = process.env.PINATA_SECRET_API_KEY;
    this.jwt = process.env.PINATA_JWT;
    this.baseUrl = 'https://api.pinata.cloud';
    
    if (!this.apiKey || !this.secretApiKey) {
      console.warn('Pinata credentials not found, IPFS features will be disabled');
      this.enabled = false;
    } else {
      this.enabled = true;
      console.log('Pinata IPFS Service initialized');
    }
  }

  // Upload file to Pinata IPFS
  async uploadFile(filePath, metadata = {}) {
    if (!this.enabled) {
      throw new Error('Pinata service not configured');
    }

    try {
      const formData = new FormData();
      const fileStream = fs.createReadStream(filePath);
      const fileName = path.basename(filePath);

      formData.append('file', fileStream);
      
      // Add metadata
      const pinataMetadata = {
        name: fileName,
        keyvalues: {
          type: metadata.type || 'file',
          description: metadata.description || 'AgriTrace file',
          uploadedAt: new Date().toISOString(),
          ...metadata
        }
      };
      
      formData.append('pinataMetadata', JSON.stringify(pinataMetadata));

      const response = await fetch(`${this.baseUrl}/pinning/pinFileToIPFS`, {
        method: 'POST',
        headers: {
          'pinata_api_key': this.apiKey,
          'pinata_secret_api_key': this.secretApiKey,
          ...formData.getHeaders()
        },
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(`Pinata upload failed: ${result.error || response.statusText}`);
      }

      console.log(`File uploaded to Pinata IPFS: ${result.IpfsHash}`);

      return {
        hash: result.IpfsHash,
        path: fileName,
        size: result.PinSize,
        url: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
        timestamp: result.Timestamp
      };

    } catch (error) {
      console.error('Error uploading to Pinata:', error);
      throw error;
    }
  }

  // Upload JSON data to Pinata IPFS
  async uploadJSON(data, name = 'metadata.json') {
    if (!this.enabled) {
      throw new Error('Pinata service not configured');
    }

    try {
      const jsonString = JSON.stringify(data, null, 2);
      
      const body = {
        pinataContent: data,
        pinataMetadata: {
          name: name,
          keyvalues: {
            type: 'json',
            description: 'AgriTrace metadata',
            uploadedAt: new Date().toISOString()
          }
        }
      };

      const response = await fetch(`${this.baseUrl}/pinning/pinJSONToIPFS`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'pinata_api_key': this.apiKey,
          'pinata_secret_api_key': this.secretApiKey
        },
        body: JSON.stringify(body)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(`Pinata JSON upload failed: ${result.error || response.statusText}`);
      }

      console.log(`JSON uploaded to Pinata IPFS: ${result.IpfsHash}`);

      return {
        hash: result.IpfsHash,
        url: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
        data,
        timestamp: result.Timestamp
      };

    } catch (error) {
      console.error('Error uploading JSON to Pinata:', error);
      throw error;
    }
  }

  // Upload batch metadata to Pinata IPFS
  async uploadBatchMetadata(batchData, photoPath = null, qualityReportPath = null) {
    if (!this.enabled) {
      throw new Error('Pinata service not configured');
    }

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
          description: 'Product photo taken at harvest',
          batchNumber: batchData.batchNumber
        });
        metadata.files.photo = photoResult;
      }

      // Upload quality report if provided
      if (qualityReportPath && fs.existsSync(qualityReportPath)) {
        const reportResult = await this.uploadFile(qualityReportPath, {
          type: 'quality_report',
          description: 'Quality assessment report',
          batchNumber: batchData.batchNumber
        });
        metadata.files.qualityReport = reportResult;
      }

      // Upload the complete metadata
      const metadataResult = await this.uploadJSON(metadata, `${batchData.batchNumber}-metadata.json`);
      
      return {
        metadataHash: metadataResult.hash,
        metadataUrl: metadataResult.url,
        photoHash: metadata.files.photo?.hash,
        qualityReportHash: metadata.files.qualityReport?.hash,
        metadata
      };

    } catch (error) {
      console.error('Error uploading batch metadata to Pinata:', error);
      throw error;
    }
  }

  // Upload handoff event to Pinata IPFS
  async uploadHandoffEvent(handoffData, photoPath = null, documentPath = null) {
    if (!this.enabled) {
      throw new Error('Pinata service not configured');
    }

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
          description: `Photo taken during ${handoffData.eventType}`,
          eventType: handoffData.eventType
        });
        eventMetadata.files.photo = photoResult;
      }

      // Upload document if provided
      if (documentPath && fs.existsSync(documentPath)) {
        const docResult = await this.uploadFile(documentPath, {
          type: 'handoff_document',
          description: `Document for ${handoffData.eventType}`,
          eventType: handoffData.eventType
        });
        eventMetadata.files.document = docResult;
      }

      // Upload the complete event metadata
      const eventResult = await this.uploadJSON(eventMetadata, `handoff-${Date.now()}.json`);
      
      return {
        eventHash: eventResult.hash,
        eventUrl: eventResult.url,
        photoHash: eventMetadata.files.photo?.hash,
        documentHash: eventMetadata.files.document?.hash,
        metadata: eventMetadata
      };

    } catch (error) {
      console.error('Error uploading handoff event to Pinata:', error);
      throw error;
    }
  }

  // Retrieve data from IPFS via Pinata gateway
  async getData(hash) {
    try {
      const response = await fetch(`https://gateway.pinata.cloud/ipfs/${hash}`);
      
      if (!response.ok) {
        throw new Error(`Failed to retrieve data: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return await response.text();
      }

    } catch (error) {
      console.error('Error retrieving from Pinata IPFS:', error);
      throw error;
    }
  }

  // Generate Pinata gateway URL
  getGatewayUrl(hash, gateway = 'https://gateway.pinata.cloud/ipfs/') {
    return `${gateway}${hash}`;
  }

  // Check if Pinata service is accessible
  async checkConnection() {
    if (!this.enabled) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/data/testAuthentication`, {
        method: 'GET',
        headers: {
          'pinata_api_key': this.apiKey,
          'pinata_secret_api_key': this.secretApiKey
        }
      });

      const result = await response.json();
      
      if (response.ok && result.message === 'Congratulations! You are communicating with the Pinata API!') {
        console.log('✅ Pinata IPFS service connected successfully');
        return true;
      } else {
        console.error('❌ Pinata authentication failed:', result);
        return false;
      }

    } catch (error) {
      console.error('❌ Pinata connection failed:', error);
      return false;
    }
  }

  // Get pinned files list
  async getPinnedFiles() {
    if (!this.enabled) {
      return [];
    }

    try {
      const response = await fetch(`${this.baseUrl}/data/pinList?status=pinned`, {
        method: 'GET',
        headers: {
          'pinata_api_key': this.apiKey,
          'pinata_secret_api_key': this.secretApiKey
        }
      });

      const result = await response.json();
      return result.rows || [];

    } catch (error) {
      console.error('Error getting pinned files:', error);
      return [];
    }
  }
}

module.exports = PinataService;