import React, { useState, useRef } from "react";
import { FaMicrophone } from "react-icons/fa";
import { MdCloudUpload, MdClear, MdDownload } from "react-icons/md";

function App() {
  const [transcript, setTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [language, setLanguage] = useState("English");
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const fileInputRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setFile(null);
    } catch (error) {
      alert("Microphone access denied or not available.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileUpload = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (isRecording) stopRecording();
    }
  };

  const transcribeAudio = async (audioData) => {
    setIsLoading(true);
    setTranscript("");
    try {
      const formData = new FormData();
      formData.append("language", language);
      formData.append("audio", audioData instanceof Blob ? audioData : file);

      const response = await fetch("http://localhost:5000/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setTranscript(data.transcript || "No transcription available.");
    } catch (error) {
      alert("Transcription failed. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const clearAll = () => {
    setTranscript("");
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (isRecording) stopRecording();
  };

  const downloadTranscript = () => {
    const element = document.createElement("a");
    const fileBlob = new Blob([transcript], { type: "text/plain" });
    element.href = URL.createObjectURL(fileBlob);
    element.download = "transcription.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-[#8e44ad] via-[#3498db] to-[#1abc9c] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-5xl bg-white/30 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl p-8 grid grid-cols-1 md:grid-cols-2 gap-10">

        {/* Left Section - Controls */}
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-indigo-600 mb-6">🎙️ Speech to Text</h1>

          {/* Language Selection */}
          <div className="mb-4">
            <label className="text-white font-semibold text-sm">Select Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full mt-2 px-4 py-2 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option>English</option>
              <option>Spanish</option>
              <option>French</option>
              <option>German</option>
            </select>
          </div>

          {/* File Upload */}
          <div className="mb-6">
            <label className="text-white font-semibold text-sm mb-2 block">Upload Audio File</label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
                id="audio-upload"
              />
              <label
                htmlFor="audio-upload"
                className="flex-1 bg-white px-4 py-2 rounded-lg cursor-pointer shadow hover:bg-gray-100 transition"
              >
                {file ? file.name : "Choose File"}
              </label>
              {file && (
                <button
                  onClick={() => transcribeAudio()}
                  disabled={isLoading}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-1 shadow transition"
                >
                  <MdCloudUpload size={20} />
                  Transcribe
                </button>
              )}
            </div>
          </div>

          {/* Recording */}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isLoading}
            className={`w-full py-3 px-6 rounded-xl font-semibold text-white flex items-center justify-center gap-3 shadow-lg transition
              ${isRecording ? "bg-red-500 hover:bg-red-600" : "bg-blue-600 hover:bg-blue-700"}
              ${isLoading ? "opacity-50 cursor-not-allowed" : ""}
            `}
          >
            <FaMicrophone />
            {isRecording ? "Stop Recording" : "Start Live Recording"}
          </button>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-6">
            <button
              onClick={clearAll}
              disabled={(!transcript && !file) || isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-yellow-200 hover:bg-yellow-300 text-yellow-800 font-bold rounded-lg transition disabled:opacity-50"
            >
              <MdClear size={20} />
              Clear
            </button>
            <button
              onClick={downloadTranscript}
              disabled={!transcript || isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition disabled:opacity-50"
            >
              <MdDownload size={20} />
              Download
            </button>
          </div>
        </div>

        {/* Right Section - Transcription Output */}
        <div className="bg-white/40 backdrop-blur-md rounded-xl p-6 border border-white/20 h-full">
          <h2 className="text-2xl font-bold text-gray-500 mb-4">📄 Transcription</h2>
          <div className="bg-white rounded-lg p-4 h-80 overflow-y-auto border border-gray-300 shadow-inner">
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-indigo-500"></div>
              </div>
            ) : transcript ? (
              <p className="whitespace-pre-wrap text-gray-800">{transcript}</p>
            ) : (
              <p className="text-gray-500 italic">
                {file
                  ? "Click 'Transcribe' to start processing."
                  : "Upload or record audio to see transcription here."}
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;
