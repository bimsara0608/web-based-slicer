import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import ProgressBar from 'react-bootstrap/ProgressBar';
import axios from 'axios';
import './FileUpload.css'; // Import the CSS file

const FileUpload = () => {
  const [files, setFiles] = useState([]); 
  const [showDropzone, setShowDropzone] = useState(true); // State for showing/hiding dropzone
  const [settings, setSettings] = useState({
    infill: 20, 
    material: 'PLA', 
    support: 'None', 
    layerHeight: 0.2,
    quality: 'Standard Quality - 0.2 mm',
    pattern: 'Cubic'
  });
  const [uploadProgress, setUploadProgress] = useState(0); 
  const [isUploading, setIsUploading] = useState(false); 

  // Define accepted file types and maximum file size in MB
  const acceptedFileTypes = ['.stl', '.obj', '.3mf', '.fbx'];
  const maxFileSize = 150 * 1024 * 1024; // 150 MB limit

  const onDrop = (acceptedFiles) => {
    const filteredFiles = acceptedFiles.filter((file) => {
      const fileType = file.name.split('.').pop().toLowerCase();
      if (!acceptedFileTypes.includes(`.${fileType}`)) {
        alert(`Unsupported file type: ${fileType.toUpperCase()}`);
        return false;
      }
      if (file.size > maxFileSize) {
        alert(`File size exceeds the limit of ${maxFileSize / (1024 * 1024)} MB`);
        return false;
      }
      return true;
    });

    if (files.length + filteredFiles.length > 5) {
      alert('You can only upload up to 5 files.');
      return;
    }

    setFiles((prevFiles) => [
      ...prevFiles,
      ...filteredFiles.map((file) => ({
        file,
        size: (file.size / 1024 / 1024).toFixed(2) + " MiB",
        status: 'Ready',
      }))
    ]);

    setUploadProgress(0);
    setIsUploading(false);
    setShowDropzone(false); // Hide dropzone once files are added
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.join(','),
  });

  const handleUpload = () => {
    if (files.length === 0) return;
    const formData = new FormData();
    files.forEach((item) => formData.append('file', item.file));
    formData.append('settings', JSON.stringify(settings));

    setIsUploading(true);
    axios.post('http://localhost:5000/upload', formData, {
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      },
    })
    .then((response) => {
      setFiles((prevFiles) =>
        prevFiles.map((item) => ({ ...item, status: 'Loaded ✔' }))
      );
      alert('File uploaded successfully!');
    })
    .catch((error) => {
      console.error('Error:', error);
      alert('Upload failed.');
    })
    .finally(() => {
      setIsUploading(false);
    });
  };

  const handleRemoveFile = (index) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    if (updatedFiles.length === 0) {
      setShowDropzone(true); // Show dropzone if all files are removed
    }
  };

  const handleAddMore = () => {
    setShowDropzone(true); // Show dropzone when "Add More" is clicked
  };

  const qualityProfiles = [
    { name: 'Super Quality - 0.12 mm', value: 0.12 },
    { name: 'Dynamic Quality - 0.16 mm', value: 0.16 },
    { name: 'Standard Quality - 0.2 mm', value: 0.2 },
    { name: 'Low Quality - 0.28 mm', value: 0.28 }
  ];

  const infillPatterns = [
    'Grid', 'Lines', 'Triangles', 'Tri-Hexagon', 'Cubic', 'Cubic Subdivision', 
    'Octet', 'Quarter Cubic', 'Concentric', 'Zig Zag', 'Cross', 'Cross 3D', 
    'Gyroid', 'Lightning'
  ];

  const handleQualityChange = (event) => {
    const selectedQuality = qualityProfiles.find(profile => profile.name === event.target.value);
    setSettings((prevSettings) => ({
      ...prevSettings,
      quality: selectedQuality.name,
      layerHeight: selectedQuality.value
    }));
  };

  const handlePatternChange = (event) => {
    setSettings((prevSettings) => ({
      ...prevSettings,
      pattern: event.target.value
    }));
  };

  return (
    <div className="upload-container">
      {/* Only show the dropzone if showDropzone is true and files are less than 5 */}
      {showDropzone && files.length < 5 && (
        <div {...getRootProps({ className: 'dropzone' })}>
          <input {...getInputProps()} />
          <p>Drag and drop files here, or click to select files</p>
        </div>
      )}

      {files.length > 0 && (
        <div className="file-details">
          {files.map((item, index) => (
            <div className="file-info" key={index}>
              <span className="file-name">{item.file.name}</span>
              <span className="file-status">{item.status}</span>
              <span className="file-size">{item.size}</span>
              <ProgressBar now={uploadProgress} className="progress-bar" />
              <button className="remove-button" onClick={() => handleRemoveFile(index)}>Remove</button>
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && files.length < 5 && (
        <button onClick={handleAddMore} className="add-more-button">
          Add More
        </button>
      )}

      {files.length > 0 && (
        <div className="settings-section">
          <label>
            Print Quality:
            <select
              value={settings.quality}
              onChange={handleQualityChange}
              style={{ width: '100%', padding: '5px', margin: '10px 0' }}
            >
              {qualityProfiles.map((profile, index) => (
                <option key={index} value={profile.name}>{profile.name}</option>
              ))}
            </select>
          </label>

          <label className="infill-density-label">
            Infill Density:
            <div className="slider-labels">
              {Array.from({ length: 11 }, (_, i) => i * 10).map((val) => (
                <span key={val} className="slider-label">{val}%</span>
              ))}
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="10"
              value={settings.infill}
              onChange={(e) => setSettings({ ...settings, infill: e.target.value })}
              className="infill-slider"
            />
          </label>

          <label>
            Infill Pattern:
            <select
              value={settings.pattern}
              onChange={handlePatternChange}
              style={{ width: '100%', padding: '5px', margin: '10px 0' }}
            >
              {infillPatterns.map((pattern, index) => (
                <option key={index} value={pattern}>{pattern}</option>
              ))}
            </select>
          </label>

          <label>
            Material:
            <select
              value={settings.material}
              onChange={(e) => setSettings({ ...settings, material: e.target.value })}
            >
              <option value="PLA">PLA</option>
              <option value="ABS">ABS</option>
              <option value="PETG">PETG</option>
            </select>
          </label>

          <label>
            Support Type:
            <select
              value={settings.support}
              onChange={(e) => setSettings({ ...settings, support: e.target.value })}
            >
              <option value="None">None</option>
              <option value="Everywhere">Everywhere</option>
              <option value="Touching Build Plate">Touching Build Plate</option>
            </select>
          </label>
        </div>
      )}

      {files.length > 0 && (
        <button
          className="upload-button"
          onClick={handleUpload}
          disabled={isUploading}
        >
          Upload & Slice
        </button>
      )}
    </div>
  );
};

export default FileUpload;
