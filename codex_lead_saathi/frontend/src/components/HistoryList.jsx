function formatDate(value) {
  if (!value) {
    return "No timestamp";
  }

  return new Date(value).toLocaleString();
}

export default function HistoryList({ items }) {
  if (!items.length) {
    return <p className="muted">No interactions yet. Submit text or voice to see history here.</p>;
  }

  return (
    <div className="history-list">
      {items.map((item) => (
        <article key={item.id} className="history-item">
          <div className="history-item-head">
            <strong>{item.status || "responded"}</strong>
            <span>{formatDate(item.startedAt || item.createdAt)}</span>
          </div>
          <p>
            <span className="label">Transcript:</span>{" "}
            {item.transcript?.transcriptText || "No transcript stored"}
          </p>
          <p>
            <span className="label">Response:</span>{" "}
            {item.response?.responseText || "No response stored"}
          </p>
        </article>
      ))}
    </div>
  );
}

