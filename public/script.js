document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("deleteModal");
  const openBtn = document.getElementById("openDeleteModal");
  const cancelBtn = document.getElementById("cancelDelete");

  if (modal && openBtn && cancelBtn) {
    openBtn.addEventListener("click", () => {
      modal.style.display = "flex";
    });

    cancelBtn.addEventListener("click", () => {
      modal.style.display = "none";
    });

    window.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.style.display = "none";
      }
    });
  }
});
