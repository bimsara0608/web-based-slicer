import React from 'react';
import './App.css';
import FileUpload from './components/FileUpload';
import 'bootstrap/dist/css/bootstrap.min.css';


function App() {
  return (
    <div className="App">
      <h1>3D Slicer - File Upload</h1>
      <FileUpload />
    </div>
  );
}

export default App;
