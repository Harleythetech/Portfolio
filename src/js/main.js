// Project data - will be loaded from JSON
let projectData = {};

// Function to load project data from JSON
// Global variable to store project data
let projectsData = null;

async function loadProjectData() {
  try {
    const response = await fetch("./src/data/projects.json");
    const data = await response.json();
    projectData = data.folders;
    projectsData = data; // Store full data globally for modal access
  } catch (error) {
    console.error("Error loading project data:", error);
    projectData = {};
    projectsData = null;
  }
}

// Function to generate folder structure dynamically
function generateFolderStructure() {
  const folderAccordion = document.getElementById("folderAccordion");

  if (!folderAccordion || !projectData) return;

  let folderHTML = "";
  let folderIndex = 0;

  Object.keys(projectData).forEach((folderName) => {
    const folder = projectData[folderName];
    const folderId = folderName.toLowerCase().replace(/\s+/g, "");

    // Determine if this should be expanded (first folder is expanded by default)
    const isExpanded = folderIndex === 0 ? "show" : "";
    const ariaExpanded = folderIndex === 0 ? "true" : "false";

    folderHTML += `
      <div class="folder-container">
        <div class="folder-item" 
             data-bs-target="#${folderId}Folder" 
             aria-expanded="${ariaExpanded}">
          <div class="folder-header d-flex align-items-center">
            <span class="folder-name">${folderName}</span>
          </div>
        </div>
        <div class="collapse ${isExpanded}" id="${folderId}Folder">
          <div class="subfolder-contents">
    `;

    // Add projects within this folder
    let projectIndex = 0;
    Object.keys(folder.projects).forEach((projectName) => {
      // First project in first folder is active by default
      const isActive = folderIndex === 0 && projectIndex === 0 ? "active" : "";

      folderHTML += `
        <div class="sub-file-item d-flex align-items-center ${isActive}" data-project="${projectName}">
          <span class="file-name">${projectName}</span>
        </div>
      `;
      projectIndex++;
    });

    folderHTML += `
          </div>
        </div>
      </div>
    `;
    folderIndex++;
  });

  folderAccordion.innerHTML = folderHTML;
}

// Function to get status badge class
function getStatusBadgeClass(status) {
  switch (status.toLowerCase()) {
    case "live":
      return "bg-success";
    case "complete":
      return "bg-primary";
    case "in progress":
      return "bg-warning text-dark";
    case "prototype":
      return "bg-info";
    case "archived":
      return "bg-secondary";
    default:
      return "bg-secondary";
  }
}

// Function to format date
function formatDate(dateString) {
  const options = { year: "numeric", month: "short", day: "numeric" };
  return new Date(dateString).toLocaleDateString("en-US", options);
}

// Function to find project in nested structure
function findProject(projectName) {
  for (const folderName in projectData) {
    const folder = projectData[folderName];
    if (folder.projects && folder.projects[projectName]) {
      return folder.projects[projectName];
    }
  }
  return null;
}

// Function to find which folder a project belongs to
function findProjectFolder(projectName) {
  for (const folderName in projectData) {
    const folder = projectData[folderName];
    if (folder.projects && folder.projects[projectName]) {
      return folderName;
    }
  }
  return null;
}

// Function to update address bar path
function updateAddressBar(folderName, projectName) {
  const pathElement = document.querySelector(".path-text");
  if (!pathElement) return;

  let newPath = "/home/harley/projects";

  if (folderName) {
    // Convert folder name to filesystem-friendly format
    const formattedFolder = folderName.toLowerCase().replace(/\s+/g, "_");
    newPath += `/${formattedFolder}`;

    if (projectName) {
      // Convert project name to filesystem-friendly format
      const formattedProject = projectName.toLowerCase().replace(/\s+/g, "_");
      newPath += `/${formattedProject}`;
    }
  }

  pathElement.textContent = newPath;
}

// Function to update content panel
function updateContentPanel(projectName) {
  const contentPanel = document.querySelector(".content-panel");
  const projectInfo = findProject(projectName);

  // Update address bar path
  const folderName = findProjectFolder(projectName);
  updateAddressBar(folderName, projectName);

  if (!projectInfo) {
    contentPanel.innerHTML = `
      <div class="text-center">
        <h5 class="mt-3 mb-2">${projectName}</h5>
        <p class="text-muted">Project details coming soon...</p>
      </div>
    `;
    return;
  }

  // Check if this project should show gallery (design projects)
  if (projectInfo.showGallery) {
    const galleryItems = projectInfo.items
      .map(
        (item) => `
        <div class="gallery-item" onclick="openGalleryModal('${
          item.image || item["preview-image"] || ""
        }', '${item.title}', '${
          item.description
        }', '${projectName}', ${projectInfo.items.indexOf(item)})">
          <div class="gallery-image">
            <img src="${item["preview-image"] || item.image}" alt="${
          item.title
        }" loading="lazy">
            <div class="gallery-overlay">
              <div class="gallery-info">
                <h6 class="gallery-title">${item.title}</h6>
                <p class="gallery-category">${item.category}</p>
              </div>
              <div class="gallery-tools">
                ${item.tools
                  .map((tool) => `<span class="tool-tag">${tool}</span>`)
                  .join("")}
              </div>
            </div>
          </div>
          <div class="gallery-details p-3">
            <h6 class="item-title">${item.title}</h6>
            <p class="item-description">${item.description}</p>
            ${
              item.date
                ? `<small class="item-date">${formatDate(item.date)}</small>`
                : ""
            }
          </div>
        </div>
      `
      )
      .join("");

    contentPanel.innerHTML = `
      <div class="gallery-container w-100 p-3 p-md-4">
        <div class="gallery-grid">
          ${galleryItems}
        </div>
      </div>
    `;

    // Ensure modal exists in body (create only once)
    createGalleryModal();
    return;
  }

  // Check if this project should show table (programming projects)
  if (!projectInfo.showTable) {
    contentPanel.innerHTML = `
      <div class="text-center">
        <h5 class="mt-3 mb-2">${projectName}</h5>
        <p class="text-muted">${projectInfo.type}</p>
        <p class="text-muted">Content layout not defined...</p>
      </div>
    `;
    return;
  }

  const tableRows = projectInfo.items
    .map(
      (item) => `
    <tr>
      <td data-label="Title">
        <div class="d-flex flex-column">
          <strong class="text-light">${item.title}</strong>
          <small class="text-muted">${item.description}</small>
        </div>
      </td>
      <td data-label="Tech Stack">
        <div class="d-flex flex-wrap gap-1">
          ${item.techStack
            .map(
              (tech) => `<span class="badge bg-dark text-light">${tech}</span>`
            )
            .join("")}
        </div>
      </td>
      <td data-label="Date">
        <small class="text-muted">${
          item.date ? formatDate(item.date) : "N/A"
        }</small>
      </td>
      <td data-label="Status">
        <span class="badge ${getStatusBadgeClass(item.status)}">${
        item.status
      }</span>
      </td>
      <td data-label="Actions">
        <div class="d-flex gap-1 flex-wrap">
          ${item.actions
            .map(
              (action) => `
            <button class="btn btn-outline-light btn-sm" onclick="window.open('${action.url}', '_blank')" title="${action.label}">
              <span class="action-text">${action.label}</span>
            </button>
          `
            )
            .join("")}
        </div>
      </td>
    </tr>
  `
    )
    .join("");

  contentPanel.innerHTML = `
    <div class="project-details w-100">
      <div class="table-responsive">
        <table class="table table-dark table-hover responsive-table">
          <thead>
            <tr>
              <th scope="col">Title</th>
              <th scope="col">Tech Stack</th>
              <th scope="col">Date</th>
              <th scope="col">Status</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// Animation helper functions
function animateCollapseOpen(element) {
  // Add collapsing class for initial state
  element.classList.add("collapsing");
  element.classList.remove("show");

  // Force reflow
  element.offsetHeight;

  // Start opening animation
  requestAnimationFrame(() => {
    element.classList.remove("collapsing");
    element.classList.add("show");
  });
}

function animateCollapseClose(element) {
  // Add collapsing class
  element.classList.add("collapsing");
  element.classList.remove("show");

  // Remove collapsing class after animation
  setTimeout(() => {
    element.classList.remove("collapsing");
  }, 350); // Match CSS transition duration
}

// Enhanced mobile interactions
// Timeline loading functions
async function loadTimelineData() {
  try {
    const response = await fetch("./src/data/timeline.json");
    const timelineData = await response.json();
    return timelineData;
  } catch (error) {
    console.error("Error loading timeline data:", error);
    return null;
  }
}

function generateTimeline(timelineData) {
  const timelineContainer = document.getElementById("timelineContainer");

  if (!timelineContainer || !timelineData) {
    console.error("Timeline container not found or no data");
    return;
  }

  let timelineHTML = "";

  // Create all timeline items in one array for chronological sorting
  let allTimelineItems = [];

  // Add education items
  if (timelineData.education && timelineData.education.length > 0) {
    timelineData.education.forEach((edu) => {
      const specialization = edu.specialization
        ? ` - ${edu.specialization}`
        : "";
      const track = edu.track ? ` (${edu.track})` : "";

      allTimelineItems.push({
        date: edu.year,
        sortYear: parseInt(edu.year.split(" - ")[0]) || parseInt(edu.year),
        type: "education",
        html: `
          <li data-category="education">
            <span class="timeline-date">${edu.year}</span>
            <h5 class="fw-bold">${edu.degree}${specialization}</h5>
            <h6 class="text-muted">${edu.institution}${track}</h6>
            <p>${edu.description}</p>
          </li>
        `,
      });
    });
  }

  // Add work experience items
  if (timelineData.work_experience && timelineData.work_experience.length > 0) {
    timelineData.work_experience.forEach((work) => {
      const roles = work.roles ? ` (${work.roles.join(", ")})` : "";

      allTimelineItems.push({
        date: work.year,
        sortYear:
          parseInt(work.year.split(" ")[0]) ||
          parseInt(work.year.split("–")[0]) ||
          2021,
        type: "work",
        html: `
          <li data-category="work">
            <span class="timeline-date">${work.year}</span>
            <h5 class="fw-bold">${work.position}${roles}</h5>
            <p>${work.description}</p>
          </li>
        `,
      });
    });
  }

  // Add project items
  if (timelineData.timeline && timelineData.timeline.length > 0) {
    timelineData.timeline.forEach((yearGroup) => {
      yearGroup.events.forEach((event) => {
        allTimelineItems.push({
          date: event.date || yearGroup.year,
          sortYear: parseInt(yearGroup.year),
          type: "projects",
          html: `
            <li data-category="projects">
              <span class="timeline-date">${event.date || yearGroup.year}</span>
              <h5 class="fw-bold">${event.title}</h5>
              <p>${event.description}</p>
            </li>
          `,
        });
      });
    });
  }

  // Add achievement items
  if (timelineData.achievements && timelineData.achievements.length > 0) {
    timelineData.achievements.forEach((achievement) => {
      allTimelineItems.push({
        date: achievement.date || achievement.year,
        sortYear: parseInt(achievement.year),
        type: "achievements",
        html: `
          <li data-category="achievements">
            <span class="timeline-date">${
              achievement.date || achievement.year
            }</span>
            <h5 class="fw-bold">${achievement.title}</h5>
            <p>${achievement.description}</p>
          </li>
        `,
      });
    });
  }

  // Sort all items by year (newest first)
  allTimelineItems.sort((a, b) => b.sortYear - a.sortYear);

  // Generate final HTML
  allTimelineItems.forEach((item) => {
    timelineHTML += item.html;
  });

  timelineContainer.innerHTML = timelineHTML;

  // Initialize timeline tabs after content is loaded
  initializeTimelineTabs();
}

document.addEventListener("DOMContentLoaded", async function () {
  // Load project data first
  await loadProjectData();

  // Load and generate timeline
  const timelineData = await loadTimelineData();
  if (timelineData) {
    generateTimeline(timelineData);
  }

  // Generate folder structure dynamically
  generateFolderStructure();

  // Use event delegation for better reliability
  function setupEventListeners() {
    // Remove existing delegated listeners first
    const folderAccordion = document.getElementById("folderAccordion");

    // Use event delegation for sub-file items
    folderAccordion.addEventListener("click", function (e) {
      // Handle sub-file item clicks
      if (e.target.closest(".sub-file-item")) {
        e.stopPropagation();
        const clickedItem = e.target.closest(".sub-file-item");

        // Remove active state from all sub-items
        const allSubItems = document.querySelectorAll(".sub-file-item");
        allSubItems.forEach((subItem) => subItem.classList.remove("active"));

        // Add active state to clicked item
        clickedItem.classList.add("active");

        // Update content panel with project details
        const projectName = clickedItem.getAttribute("data-project");
        updateContentPanel(projectName);
        return;
      }

      // Handle folder item clicks
      if (e.target.closest(".folder-item")) {
        const folderElement = e.target.closest(".folder-item");
        handleFolderClick(folderElement, e);
      }
    });
  }

  // Separate function for folder click handling
  function handleFolderClick(folderElement, e) {
    // Prevent default Bootstrap behavior
    e.preventDefault();
    e.stopPropagation();
  }

  // Separate function for folder click handling
  function handleFolderClick(folderElement, e) {
    // Add visual feedback
    folderElement.style.transform = "scale(0.98)";
    setTimeout(() => {
      folderElement.style.transform = "scale(1)";
    }, 100);

    // Get folder name and target element
    const folderName = folderElement.querySelector(".folder-name").textContent;
    const targetId = folderElement.getAttribute("data-bs-target");
    const targetElement = document.querySelector(targetId);

    // Get all folder collapse elements
    const allCollapseElements = document.querySelectorAll(
      ".folder-container .collapse"
    );

    if (targetElement) {
      const isCurrentlyOpen = targetElement.classList.contains("show");

      if (isCurrentlyOpen) {
        // Close the currently open folder with animation
        animateCollapseClose(targetElement);
        folderElement.setAttribute("aria-expanded", "false");
        // Reset to base path when closing
        setTimeout(() => {
          updateAddressBar(null, null);
        }, 100);
      } else {
        // Close all other folders first with animation
        allCollapseElements.forEach((collapseEl) => {
          if (
            collapseEl !== targetElement &&
            collapseEl.classList.contains("show")
          ) {
            animateCollapseClose(collapseEl);
            // Find the corresponding folder item and update its aria-expanded
            const correspondingFolder = document.querySelector(
              `[data-bs-target="#${collapseEl.id}"]`
            );
            if (correspondingFolder) {
              correspondingFolder.setAttribute("aria-expanded", "false");
            }
          }
        });

        // Open the clicked folder with animation (after a short delay to let others close)
        setTimeout(() => {
          try {
            animateCollapseOpen(targetElement);
            folderElement.setAttribute("aria-expanded", "true");

            // Update address bar to show folder path
            updateAddressBar(folderName, null);

            // Clear any selected project when switching folders
            const allSubItems = document.querySelectorAll(".sub-file-item");
            allSubItems.forEach((item) => item.classList.remove("active"));

            // Clear content panel or show folder default content
            const contentPanel = document.querySelector(".content-panel");
            contentPanel.innerHTML = `
              <div class="text-center empty-state">
                <div class="empty-icon mb-3">📁</div>
                <h5 class="text-muted">Select a project from ${folderName}</h5>
                <p class="text-muted">Choose a project from the left sidebar to view details</p>
              </div>
            `;
          } catch (error) {
            console.error("Error in folder animation:", error);
            // Fallback: just show the content without animation
            targetElement.classList.add("show");
            folderElement.setAttribute("aria-expanded", "true");
            updateAddressBar(folderName, null);
          }
        }, 150);
      }
    }
  }

  // Setup event listeners after generating structure
  setupEventListeners();

  // Initialize with the active project on page load
  const activeItem = document.querySelector(".sub-file-item.active");
  if (activeItem) {
    const projectName = activeItem.getAttribute("data-project");
    updateContentPanel(projectName);
  } else {
    // No active project, show base path
    updateAddressBar(null, null);
  }

  // Handle responsive behavior
  function handleResize() {
    const isMobile = window.innerWidth < 768;
    const explorerContent = document.querySelector(".explorer-content");

    if (isMobile) {
      explorerContent.classList.add("mobile-layout");
    } else {
      explorerContent.classList.remove("mobile-layout");
    }
  }

  // Initial check and resize listener
  handleResize();
  window.addEventListener("resize", handleResize);
});

// Function to create gallery modal (only once)
function createGalleryModal() {
  // Check if modal already exists
  if (document.getElementById("galleryModal")) {
    return;
  }

  // Create modal HTML with carousel support
  const modalHTML = `
    <!-- Gallery Modal -->
    <div class="modal fade" id="galleryModal" tabindex="-1" aria-hidden="true" style="z-index: 9999;">
      <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable" style="max-width: 90vw; margin: 2rem auto;">
        <div class="modal-content bg-dark">
          <div class="modal-header border-0">
            <h5 class="modal-title" id="modalTitle"></h5>
            <span id="imageCounter" class="text-muted small me-3"></span>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body text-center p-3">
            <!-- Single Image/Iframe Display -->
            <div id="singleImageContainer" class="d-flex justify-content-center align-items-center">
              <img id="modalImage" src="" alt="" class="img-fluid rounded mw-100 h-auto" style="max-height: 70vh; object-fit: contain;">
              <iframe id="modalIframe" src="" title="" class="rounded border-0 d-none" style="width: 100%; height: 70vh; max-width: 1200px;" allowfullscreen></iframe>
            </div>
            
            <!-- Carousel for Multiple Images -->
            <div id="imageCarousel" class="carousel slide d-none" data-bs-ride="false" data-bs-touch="true">
              <div class="carousel-inner" id="carouselInner">
                <!-- Dynamic carousel items will be inserted here -->
              </div>
              <button class="carousel-control-prev" type="button" data-bs-target="#imageCarousel" data-bs-slide="prev">
                <span class="carousel-control-prev-icon" aria-hidden="true" style="filter: invert(1) !important; background-color: rgba(255,255,255,0.1) !important; border-radius: 50% !important; padding: 10px !important;"></span>
                <span class="visually-hidden">Previous</span>
              </button>
              <button class="carousel-control-next" type="button" data-bs-target="#imageCarousel" data-bs-slide="next">
                <span class="carousel-control-next-icon" aria-hidden="true" style="filter: invert(1) !important; background-color: rgba(255,255,255,0.1) !important; border-radius: 50% !important; padding: 10px !important;"></span>
                <span class="visually-hidden">Next</span>
              </button>
              <div class="carousel-indicators" id="carouselIndicators">
                <!-- Dynamic indicators will be inserted here -->
              </div>
            </div>
            
            <p id="modalDescription" class="mt-3 text-muted"></p>
            <p id="imageCaption" class="mt-2 text-light small"></p>
          </div>
        </div>
      </div>
    </div>
  `;

  // Add modal to body
  document.body.insertAdjacentHTML("beforeend", modalHTML);
}

// Function to open gallery modal with support for multiple images
function openGalleryModal(
  imageSrc,
  title,
  description,
  projectName = null,
  itemIndex = null
) {
  let projectData = null;

  // If we have project name and index, get the full project data
  if (projectName && itemIndex !== null && projectsData) {
    const designProjects = projectsData.folders.Designs.projects;
    const project = designProjects[projectName];
    if (project && project.items[itemIndex]) {
      projectData = project.items[itemIndex];
    }
  }
  // Ensure modal exists
  createGalleryModal();

  const modalElement = document.getElementById("galleryModal");
  const modal = new bootstrap.Modal(modalElement);

  document.getElementById("modalTitle").textContent = title;
  document.getElementById("modalDescription").textContent = description;

  // Check if project has multiple images
  const hasMultipleImages =
    projectData && projectData.images && projectData.images.length > 1;

  if (hasMultipleImages) {
    // Hide single image, show carousel
    document.getElementById("singleImageContainer").classList.add("d-none");
    document.getElementById("imageCarousel").classList.remove("d-none");

    // Build carousel items
    const carouselInner = document.getElementById("carouselInner");
    const carouselIndicators = document.getElementById("carouselIndicators");
    const imageCounter = document.getElementById("imageCounter");

    // Clear existing content
    carouselInner.innerHTML = "";
    carouselIndicators.innerHTML = "";

    // Update counter
    imageCounter.textContent = `1 / ${projectData.images.length}`;

    // Create carousel items
    projectData.images.forEach((imageData, index) => {
      // Create carousel item
      const carouselItem = document.createElement("div");
      carouselItem.className = `carousel-item ${index === 0 ? "active" : ""}`;

      // Check if it's an iframe or regular image
      if (imageData["iframe-url"]) {
        // Create iframe for Figma designs
        carouselItem.innerHTML = `
          <div class="d-flex justify-content-center align-items-center" style="height: 70vh;">
            <iframe src="${imageData["iframe-url"]}" 
                    title="${imageData.caption || title}"
                    class="rounded border-0" 
                    style="width: 100%; height: 70vh; max-width: 1200px;"
                    allowfullscreen>
            </iframe>
          </div>
        `;
      } else {
        // Create regular image
        carouselItem.innerHTML = `
          <div class="d-flex justify-content-center align-items-center" style="height: 70vh;">
            <img src="${imageData.url}" alt="${imageData.caption || title}" 
                 class="img-fluid rounded mw-100 h-auto" 
                 style="max-height: 70vh; object-fit: contain;">
          </div>
        `;
      }
      carouselInner.appendChild(carouselItem);

      // Create indicator
      const indicator = document.createElement("button");
      indicator.type = "button";
      indicator.setAttribute("data-bs-target", "#imageCarousel");
      indicator.setAttribute("data-bs-slide-to", index);
      indicator.className = index === 0 ? "active" : "";
      if (index === 0) indicator.setAttribute("aria-current", "true");
      indicator.setAttribute("aria-label", `Slide ${index + 1}`);
      carouselIndicators.appendChild(indicator);
    });

    // Update caption for first image
    const imageCaption = document.getElementById("imageCaption");
    imageCaption.textContent = projectData.images[0].caption || "";

    // Add event listener for carousel slide events to update counter and caption
    const carousel = document.getElementById("imageCarousel");
    carousel.addEventListener("slid.bs.carousel", function (event) {
      const activeIndex = event.to;
      imageCounter.textContent = `${activeIndex + 1} / ${
        projectData.images.length
      }`;
      imageCaption.textContent = projectData.images[activeIndex].caption || "";
    });
  } else {
    // Show single image/iframe, hide carousel
    document.getElementById("singleImageContainer").classList.remove("d-none");
    document.getElementById("imageCarousel").classList.add("d-none");
    document.getElementById("imageCounter").textContent = "";
    document.getElementById("imageCaption").textContent = "";

    // Check if projectData has iframe-url for single item
    const modalImage = document.getElementById("modalImage");
    const modalIframe = document.getElementById("modalIframe");

    if (projectData && projectData["iframe-url"]) {
      // Show iframe, hide image
      modalImage.classList.add("d-none");
      modalIframe.classList.remove("d-none");
      modalIframe.src = projectData["iframe-url"];
      modalIframe.title = title;
    } else {
      // Show image, hide iframe
      modalIframe.classList.add("d-none");
      modalImage.classList.remove("d-none");
      modalImage.src = imageSrc;
      modalImage.alt = title;
    }
  }

  modal.show();
}

// Helper function to open modal by project name and item index
function openGalleryModalById(projectName, itemIndex) {
  if (!projectsData || !projectsData.folders || !projectsData.folders.Designs) {
    console.error("ProjectsData structure issue");
    return;
  }

  const designProjects = projectsData.folders.Designs.projects;
  if (!designProjects || !designProjects[projectName]) {
    console.error(
      "Project not found:",
      projectName,
      "Available projects:",
      Object.keys(designProjects || {})
    );
    return;
  }

  const project = designProjects[projectName];
  const item = project.items[itemIndex];

  if (!item) {
    console.error(
      "Item not found at index:",
      itemIndex,
      "Available items:",
      project.items.length
    );
    return;
  }
  // Call the main modal function with full project data
  openGalleryModal(item.image, item.title, item.description, item);
}

// Simpler function to open project modal by index
function openProjectModal(itemIndex) {
  // Find the clicked element to get project name
  const activeFolder = document.querySelector(".collapse.show");
  if (!activeFolder) {
    console.error("No active folder found");
    return;
  }

  // Get project name from the active folder's previous sibling
  const folderButton = document.querySelector(
    `[data-bs-target="#${activeFolder.id}"]`
  );
  const projectName = folderButton
    ? folderButton.querySelector(".folder-name").textContent
    : null;

  if (!projectsData || !projectName) {
    console.error("Missing data:", {
      projectsData: !!projectsData,
      projectName,
    });
    return;
  }

  const designProjects = projectsData.folders.Designs.projects;

  const project = designProjects[projectName];

  const item = project?.items[itemIndex];

  if (!item) {
    console.error(
      "Item not found at index:",
      itemIndex,
      "in project:",
      projectName
    );
    console.error(
      "Available items:",
      project?.items?.map((i) => i.title) || "No items"
    );
    return;
  }

  openGalleryModal(item.image, item.title, item.description, item);
}

// Timeline Tab Functionality
function initializeTimelineTabs() {
  const tabs = document.querySelectorAll(".timeline-tab");
  const timelineItems = document.querySelectorAll(
    ".timeline li[data-category]"
  );

  // Initially show only education items (default active tab)
  timelineItems.forEach((item) => {
    if (item.dataset.category === "education") {
      item.classList.remove("hidden");
    } else {
      item.classList.add("hidden");
    }
  });

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      // Remove active class from all tabs
      tabs.forEach((t) => t.classList.remove("active"));
      // Add active class to clicked tab
      tab.classList.add("active");

      const selectedCategory = tab.dataset.category;

      // Show/hide timeline items based on selected category
      timelineItems.forEach((item) => {
        if (item.dataset.category === selectedCategory) {
          item.classList.remove("hidden");
        } else {
          item.classList.add("hidden");
        }
      });
    });
  });
}

// Initialize timeline tabs after timeline is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Wait for timeline to load, then initialize tabs
  setTimeout(initializeTimelineTabs, 100);
});

// Contact Form Functionality - Web3Forms Integration
function initializeContactForm() {
  const contactForm = document.getElementById("contactForm");
  const result = document.getElementById("result");

  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();

      // Show loading state
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;

      submitBtn.innerHTML =
        '<i class="bi bi-hourglass-split me-2"></i>Sending...';
      submitBtn.disabled = true;

      result.style.display = "block";
      result.innerHTML = "Please wait...";
      result.className = "mt-3 text-center text-info";

      // Prepare form data
      const formData = new FormData(contactForm);
      const object = Object.fromEntries(formData);
      const json = JSON.stringify(object);

      // Submit to Web3Forms
      fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: json,
      })
        .then(async (response) => {
          let json = await response.json();
          if (response.status == 200) {
            result.innerHTML =
              '<i class="bi bi-check-circle-fill me-2"></i>Message sent successfully!';
            result.className = "mt-3 text-center text-success";

            // Success state for button
            submitBtn.innerHTML =
              '<i class="bi bi-check-circle-fill me-2"></i>Message Sent!';
            submitBtn.classList.add("btn-success");
            submitBtn.classList.remove("btn-primary");

            // Reset form
            contactForm.reset();
          } else {
            console.log(response);
            result.innerHTML = `<i class="bi bi-exclamation-triangle-fill me-2"></i>${json.message}`;
            result.className = "mt-3 text-center text-warning";
          }
        })
        .catch((error) => {
          console.log(error);
          result.innerHTML =
            '<i class="bi bi-x-circle-fill me-2"></i>Something went wrong! Please try again.';
          result.className = "mt-3 text-center text-danger";
        })
        .then(function () {
          // Reset button after 3 seconds
          setTimeout(() => {
            submitBtn.innerHTML = originalText;
            submitBtn.classList.remove("btn-success");
            submitBtn.classList.add("btn-primary");
            submitBtn.disabled = false;
            result.style.display = "none";
          }, 5000);
        });
    });
  }
}

// Initialize contact form when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  initializeContactForm();
});
