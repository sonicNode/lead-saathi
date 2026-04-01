import { useEffect, useMemo, useState } from "react";
import { api } from "./api/client";
import Panel from "./components/Panel";
import Recorder from "./components/Recorder";
import HistoryList from "./components/HistoryList";

const defaultUserForm = {
  name: "",
  phone: "",
  email: "",
  language: "en-IN"
};

const defaultLeadForm = {
  category: "general",
  summary: "",
  notes: ""
};

function base64ToBlob(base64, mimeType) {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);

  for (let index = 0; index < byteCharacters.length; index += 1) {
    byteNumbers[index] = byteCharacters.charCodeAt(index);
  }

  return new Blob([new Uint8Array(byteNumbers)], { type: mimeType });
}

export default function App() {
  const [health, setHealth] = useState(null);
  const [userForm, setUserForm] = useState(defaultUserForm);
  const [leadForm, setLeadForm] = useState(defaultLeadForm);
  const [user, setUser] = useState(null);
  const [leads, setLeads] = useState([]);
  const [history, setHistory] = useState([]);
  const [voiceText, setVoiceText] = useState("");
  const [latestInteraction, setLatestInteraction] = useState(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [notice, setNotice] = useState({
    tone: "info",
    message: "Create a user profile to activate lead tracking and voice workflows."
  });
  const [busySection, setBusySection] = useState("");

  const healthSummary = useMemo(() => {
    if (!health) {
      return "Checking backend status...";
    }

    return `Storage: ${health.storage} | Voice: ${health.voiceProvider} | Sarvam configured: ${health.sarvamConfigured ? "yes" : "no"}`;
  }, [health]);

  useEffect(() => {
    async function loadHealth() {
      try {
        const response = await api.getHealth();
        setHealth(response);
      } catch (error) {
        setNotice({
          tone: "error",
          message: error.message || "Backend is not reachable yet."
        });
      }
    }

    loadHealth();
  }, []);

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  useEffect(() => {
    if (!user?.id) {
      setLeads([]);
      setHistory([]);
      return;
    }

    refreshUserData(user.id);
  }, [user?.id]);

  async function refreshUserData(userId) {
    const [leadResponse, historyResponse] = await Promise.all([
      api.listLeads(userId),
      api.getHistory(userId)
    ]);

    setLeads(leadResponse.items || []);
    setHistory(historyResponse.items || []);
  }

  function updateUserForm(field, value) {
    setUserForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  function updateLeadForm(field, value) {
    setLeadForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  function updateLatestInteraction(result) {
    setLatestInteraction(result);

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    const blob = base64ToBlob(result.audio.audioBase64, result.audio.audioMimeType);
    setAudioUrl(URL.createObjectURL(blob));
  }

  async function handleOnboardSubmit(event) {
    event.preventDefault();
    setBusySection("onboard");

    try {
      const response = await api.onboardUser(userForm);
      setUser(response.user);
      setUserForm(defaultUserForm);
      setNotice({
        tone: "success",
        message: `User profile created for ${response.user.name}.`
      });
    } catch (error) {
      setNotice({
        tone: "error",
        message: error.message
      });
    } finally {
      setBusySection("");
    }
  }

  async function handleLeadSubmit(event) {
    event.preventDefault();

    if (!user?.id) {
      setNotice({
        tone: "error",
        message: "Create a user profile before saving leads."
      });
      return;
    }

    setBusySection("lead");

    try {
      await api.createLead({
        userId: user.id,
        ...leadForm
      });
      await refreshUserData(user.id);
      setLeadForm(defaultLeadForm);
      setNotice({
        tone: "success",
        message: "Lead saved successfully."
      });
    } catch (error) {
      setNotice({
        tone: "error",
        message: error.message
      });
    } finally {
      setBusySection("");
    }
  }

  async function handleTextSubmit(event) {
    event.preventDefault();

    if (!user?.id) {
      setNotice({
        tone: "error",
        message: "Create a user profile before sending text."
      });
      return;
    }

    setBusySection("voice");

    try {
      const result = await api.sendTextResponse({
        userId: user.id,
        text: voiceText,
        targetLanguageCode: user.language
      });
      updateLatestInteraction(result);
      setVoiceText("");
      await refreshUserData(user.id);
      setNotice({
        tone: "success",
        message: "Text request processed successfully."
      });
    } catch (error) {
      setNotice({
        tone: "error",
        message: error.message
      });
    } finally {
      setBusySection("");
    }
  }

  async function handleAudioSend(audioBlob) {
    if (!user?.id) {
      throw new Error("Create a user profile before sending voice.");
    }

    setBusySection("voice");

    try {
      const result = await api.sendAudioResponse({
        userId: user.id,
        audioBlob,
        targetLanguageCode: user.language
      });
      updateLatestInteraction(result);
      await refreshUserData(user.id);
      setNotice({
        tone: "success",
        message: "Voice request processed successfully."
      });
    } finally {
      setBusySection("");
    }
  }

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Lead Saathi</p>
          <h1>Voice-first lead assistance scaffold</h1>
          <p className="hero-copy">
            Frontend, backend, MongoDB-ready storage, and Sarvam voice hooks are set up so we can
            move even before real credentials are available.
          </p>
        </div>
        <div className="status-card">
          <span className="status-label">Backend status</span>
          <strong>{health ? "Online" : "Waiting"}</strong>
          <p>{healthSummary}</p>
        </div>
      </header>

      <section className={`notice notice-${notice.tone}`}>
        <strong>{notice.tone === "error" ? "Attention" : "Status"}:</strong> {notice.message}
      </section>

      <main className="grid-layout">
        <Panel title="User onboarding" subtitle="Create the profile that will own leads and voice history.">
          <form className="form-stack" onSubmit={handleOnboardSubmit}>
            <label>
              Name
              <input
                value={userForm.name}
                onChange={(event) => updateUserForm("name", event.target.value)}
                placeholder="Ankit Sharma"
                required
              />
            </label>
            <label>
              Phone
              <input
                value={userForm.phone}
                onChange={(event) => updateUserForm("phone", event.target.value)}
                placeholder="+91..."
              />
            </label>
            <label>
              Email
              <input
                value={userForm.email}
                onChange={(event) => updateUserForm("email", event.target.value)}
                placeholder="name@example.com"
                type="email"
              />
            </label>
            <label>
              Language code
              <input
                value={userForm.language}
                onChange={(event) => updateUserForm("language", event.target.value)}
                placeholder="en-IN"
              />
            </label>
            <button className="primary-button" type="submit" disabled={busySection === "onboard"}>
              {busySection === "onboard" ? "Creating..." : "Create profile"}
            </button>
          </form>

          {user ? (
            <div className="summary-card">
              <span className="pill">Active user</span>
              <h3>{user.name}</h3>
              <p>{user.email || "No email added"}</p>
              <p>{user.phone || "No phone added"}</p>
              <p>Language: {user.language}</p>
            </div>
          ) : null}
        </Panel>

        <Panel title="Lead capture" subtitle="Save structured follow-up items against the current user.">
          <form className="form-stack" onSubmit={handleLeadSubmit}>
            <label>
              Category
              <select
                value={leadForm.category}
                onChange={(event) => updateLeadForm("category", event.target.value)}
              >
                <option value="general">General</option>
                <option value="employment">Employment</option>
                <option value="education">Education</option>
                <option value="government-support">Government support</option>
                <option value="healthcare">Healthcare</option>
              </select>
            </label>
            <label>
              Summary
              <textarea
                value={leadForm.summary}
                onChange={(event) => updateLeadForm("summary", event.target.value)}
                placeholder="Short description of the lead"
                rows="4"
                required
              />
            </label>
            <label>
              Notes
              <textarea
                value={leadForm.notes}
                onChange={(event) => updateLeadForm("notes", event.target.value)}
                placeholder="Optional context"
                rows="3"
              />
            </label>
            <button className="primary-button" type="submit" disabled={busySection === "lead"}>
              {busySection === "lead" ? "Saving..." : "Save lead"}
            </button>
          </form>

          <div className="list-stack">
            {leads.length ? (
              leads.map((lead) => (
                <article key={lead.id} className="list-item">
                  <div className="list-item-head">
                    <strong>{lead.category}</strong>
                    <span>{new Date(lead.createdAt).toLocaleString()}</span>
                  </div>
                  <p>{lead.summary}</p>
                  {lead.notes ? <p className="muted">{lead.notes}</p> : null}
                </article>
              ))
            ) : (
              <p className="muted">Saved leads will appear here once you create a profile.</p>
            )}
          </div>
        </Panel>

        <Panel title="Voice + text workflow" subtitle="Use text now, switch to Sarvam later without changing the UI.">
          <form className="form-stack" onSubmit={handleTextSubmit}>
            <label>
              Text fallback
              <textarea
                value={voiceText}
                onChange={(event) => setVoiceText(event.target.value)}
                placeholder="Describe what the user asked for..."
                rows="4"
              />
            </label>
            <button className="primary-button" type="submit" disabled={busySection === "voice"}>
              {busySection === "voice" ? "Processing..." : "Send text"}
            </button>
          </form>

          <Recorder disabled={busySection === "voice"} onSend={handleAudioSend} />

          {latestInteraction ? (
            <div className="summary-card">
              <span className="pill">Latest interaction</span>
              <p>
                <span className="label">Transcript:</span> {latestInteraction.transcript.transcriptText}
              </p>
              <p>
                <span className="label">Reply:</span> {latestInteraction.response.responseText}
              </p>
              <p>
                <span className="label">Intent:</span> {latestInteraction.metadata.intent}
              </p>
              {audioUrl ? <audio controls src={audioUrl} className="audio-preview" /> : null}
            </div>
          ) : (
            <p className="muted">The latest transcript and generated voice reply will appear here.</p>
          )}
        </Panel>

        <Panel title="History" subtitle="Every interaction is stored by session for easy review and retries.">
          <HistoryList items={history} />
        </Panel>
      </main>
    </div>
  );
}

