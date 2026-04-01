import { useEffect, useMemo, useRef, useState } from "react";

function getSupportedMimeType() {
  const mimeTypes = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4"
  ];

  return mimeTypes.find((mimeType) => window.MediaRecorder?.isTypeSupported(mimeType));
}

export default function Recorder({ disabled, onSend }) {
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const [recordingState, setRecordingState] = useState("idle");
  const [audioBlob, setAudioBlob] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const supportedMimeType = useMemo(
    () => (typeof window !== "undefined" ? getSupportedMimeType() : ""),
    []
  );

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [previewUrl]);

  async function startRecording() {
    try {
      setErrorMessage("");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mediaRecorder = new MediaRecorder(
        stream,
        supportedMimeType ? { mimeType: supportedMimeType } : undefined
      );

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const recordedBlob = new Blob(chunksRef.current, {
          type: mediaRecorder.mimeType || "audio/webm"
        });

        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }

        setAudioBlob(recordedBlob);
        setPreviewUrl(URL.createObjectURL(recordedBlob));
        setRecordingState("ready");
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setRecordingState("recording");
    } catch (error) {
      setErrorMessage(error.message || "Microphone permission was denied.");
      setRecordingState("idle");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecordingState("stopping");
  }

  async function sendRecording() {
    if (!audioBlob) {
      return;
    }

    setRecordingState("sending");

    try {
      await onSend(audioBlob);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setAudioBlob(null);
      setPreviewUrl("");
      setRecordingState("idle");
    } catch (error) {
      setErrorMessage(error.message || "Failed to send recording.");
      setRecordingState("ready");
    }
  }

  function resetRecording() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setAudioBlob(null);
    setPreviewUrl("");
    setRecordingState("idle");
    setErrorMessage("");
  }

  if (typeof window !== "undefined" && !window.MediaRecorder) {
    return <p className="muted">This browser does not support direct recording.</p>;
  }

  return (
    <div className="recorder">
      <div className="button-row">
        {recordingState !== "recording" ? (
          <button type="button" className="primary-button" onClick={startRecording} disabled={disabled}>
            Start recording
          </button>
        ) : (
          <button type="button" className="secondary-button" onClick={stopRecording}>
            Stop recording
          </button>
        )}

        <button
          type="button"
          className="secondary-button"
          onClick={sendRecording}
          disabled={!audioBlob || recordingState === "sending" || disabled}
        >
          Send voice
        </button>

        <button
          type="button"
          className="ghost-button"
          onClick={resetRecording}
          disabled={!audioBlob && recordingState === "idle"}
        >
          Reset
        </button>
      </div>

      {previewUrl ? <audio controls src={previewUrl} className="audio-preview" /> : null}
      {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
    </div>
  );
}

