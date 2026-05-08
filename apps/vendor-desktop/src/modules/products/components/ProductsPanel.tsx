function ProductsPanel() {
  return (
    <section
      style={{
        background: "#fff",
        border: "1px solid #ddd",
        borderRadius: "6px",
        padding: "8px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      <input
        placeholder="Buscar producto..."
        style={{
          padding: "10px",
          border: "1px solid #ccc",
          borderRadius: "6px",
          fontSize: "14px",
        }}
      />

      <div
        style={{
          flex: 1,
          border: "1px dashed #ddd",
          borderRadius: "6px",
          padding: "8px",
          fontSize: "13px",
          color: "#666",
        }}
      >
        Productos
      </div>
    </section>
  );
}

export default ProductsPanel;