//Modal for the delete recipe
document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("deleteModal");
  const openBtn = document.getElementById("openDeleteModal");
  const cancelBtn = document.getElementById("cancelDelete");

  if (modal && openBtn && cancelBtn) {
    openBtn.addEventListener("click", () => {
      modal.style.display = "flex";
    });

    //Close modal, click cancel
    cancelBtn.addEventListener("click", () => {
      modal.style.display = "none";
    });

    //Close modal, click outside
    window.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.style.display = "none";
      }
    });
  }
});

//Hamburger toggle
document.addEventListener("DOMContentLoaded", () => {
  const hamburger = document.getElementById("hamburger");
  const navCenter = document.getElementById("navLinks");

  if (hamburger && navCenter) {
    hamburger.addEventListener("click", () => {
      navCenter.classList.toggle("active");
    });
  }
});
