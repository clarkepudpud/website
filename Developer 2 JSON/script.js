const upload = document.getElementById('profileUpload');
const preview = document.getElementById('profilePreview');

//  New Section Toggle Logic
document.addEventListener("DOMContentLoaded", function () {
  const sections = ['home', 'about', 'projects', 'experience', 'contact', 'faq'];
  const navLinks = document.querySelectorAll('.nav-menu a');
  const homeBtn = document.getElementById('homeBtn');
  const titleClick = document.getElementById('titleClick');

  function showSection(idToShow) {
  const footer = document.getElementById("siteFooter");

  sections.forEach(id => {
    const section = document.getElementById(id);
    if (section) {
      section.style.display = (id === idToShow) ? 'block' : 'none';
    }
  });

  // Show footer only in Home, hide in all others
  footer.style.display = (idToShow === 'home') ? 'block' : 'none';
}

  // Initial: show only home
  showSection('home');

  // Home button (name click)
  homeBtn.addEventListener('click', function (e) {
    e.preventDefault();
    showSection('home');
  });

  // Developer title also clickable
  titleClick.addEventListener('click', function () {
    showSection('home');
  });

  // Nav links
  navLinks.forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      const targetId = this.getAttribute('href').substring(1);
      showSection(targetId);
    });
  });
});


// Get elements
var modal = document.getElementById("imgModal");
var img = document.getElementById("profileImg");
var modalImg = document.getElementById("modalImg");
var close = document.getElementsByClassName("close")[0];

// When profile image is clicked
img.onclick = function(){
  modal.style.display = "block";
  modalImg.src = this.src;
}

// When close button is clicked
close.onclick = function() {
  modal.style.display = "none";
}

// Click outside image to close
modal.onclick = function(e){
  if(e.target == modal){
    modal.style.display = "none";
  }
}

