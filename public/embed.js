/**
 * OmniChat AI — Embeddable Web Chat Widget Script
 * Dành cho mọi website: WordPress, Landing Page, React, HTML tĩnh...
 * Sử dụng: <script src="https://your-domain/embed.js" data-theme-color="#2563eb" data-position="right"></script>
 */

(function () {
  if (window.OmniChatLoaded) return;
  window.OmniChatLoaded = true;

  // 1. Lấy thông tin cấu hình từ script tag
  var currentScript =
    document.currentScript ||
    (function () {
      var scripts = document.getElementsByTagName("script");
      return scripts[scripts.length - 1];
    })();

  var scriptSrc = currentScript ? currentScript.src : "";
  var baseUrl = "";
  try {
    var urlObj = new URL(scriptSrc);
    baseUrl = urlObj.origin;
  } catch (e) {
    baseUrl = window.location.origin;
  }

  var themeColor =
    (currentScript && currentScript.getAttribute("data-theme-color")) || "#2563eb";
  var position =
    (currentScript && currentScript.getAttribute("data-position")) || "right"; // 'right' hoặc 'left'
  var widgetTitle =
    (currentScript && currentScript.getAttribute("data-title")) ||
    "Golden Palace - Hỗ trợ tiệc cưới & sự kiện";
  var widgetGreeting =
    (currentScript && currentScript.getAttribute("data-greeting")) || "";

  // 2. Tạo CSS cho nút chat và popup iframe
  var style = document.createElement("style");
  style.innerHTML = `
    .omnichat-container {
      position: fixed;
      bottom: 24px;
      ${position === "left" ? "left: 24px;" : "right: 24px;"}
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    .omnichat-toggle-btn {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: ${themeColor};
      color: #ffffff;
      border: none;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      outline: none;
    }
    .omnichat-toggle-btn:hover {
      transform: scale(1.08);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.25);
    }
    .omnichat-toggle-btn:active {
      transform: scale(0.95);
    }
    .omnichat-toggle-btn svg {
      width: 28px;
      height: 28px;
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
      transition: transform 0.2s ease;
    }
    .omnichat-iframe-wrapper {
      position: absolute;
      bottom: 75px;
      ${position === "left" ? "left: 0;" : "right: 0;"}
      width: 390px;
      height: 560px;
      max-width: calc(100vw - 32px);
      max-height: calc(100vh - 120px);
      background: #ffffff;
      border-radius: 24px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      border: 1px solid rgba(226, 232, 240, 0.9);
      overflow: hidden;
      opacity: 0;
      transform: translateY(20px) scale(0.95);
      transform-origin: ${position === "left" ? "bottom left" : "bottom right"};
      pointer-events: none;
      transition: opacity 0.3s, transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .omnichat-iframe-wrapper.open {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: auto;
    }
    .omnichat-iframe {
      width: 100%;
      height: 100%;
      border: none;
    }
    @media (max-width: 480px),
      (pointer: coarse) and (orientation: landscape) and (max-height: 500px) {
      .omnichat-iframe-wrapper {
        position: fixed;
        top: var(--omnichat-top, 0px);
        left: 0;
        right: 0;
        bottom: auto;
        width: 100vw;
        height: var(--omnichat-height, 100dvh);
        max-width: 100vw;
        max-height: none;
        box-sizing: border-box;
        border: 0;
        border-radius: 0;
        padding: env(safe-area-inset-top, 0px) env(safe-area-inset-right, 0px)
          env(safe-area-inset-bottom, 0px) env(safe-area-inset-left, 0px);
        z-index: 1000000;
      }
    }
  `;
  document.head.appendChild(style);

  // 3. Tạo cấu trúc DOM
  var container = document.createElement("div");
  container.className = "omnichat-container";

  var iframeWrapper = document.createElement("div");
  iframeWrapper.className = "omnichat-iframe-wrapper";

  var iframe = document.createElement("iframe");
  iframe.className = "omnichat-iframe";
  var queryParams = [
    "embedded=true",
    "color=" + encodeURIComponent(themeColor),
    "position=" + encodeURIComponent(position),
    "title=" + encodeURIComponent(widgetTitle),
  ];
  if (widgetGreeting) {
    queryParams.push("greeting=" + encodeURIComponent(widgetGreeting));
  }
  iframe.src = baseUrl + "/widget?" + queryParams.join("&");
  iframe.title = "OmniChat AI Assistant";
  iframeWrapper.appendChild(iframe);

  var button = document.createElement("button");
  button.className = "omnichat-toggle-btn";
  button.setAttribute("aria-label", "Mở khung chat");

  var chatIcon = `
    <svg viewBox="0 0 24 24">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  `;
  var closeIcon = `
    <svg viewBox="0 0 24 24">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  `;

  button.innerHTML = chatIcon;

  var isOpen = false;
  var viewport = window.visualViewport;
  function fitMobileFrame() {
    if (!viewport || !isOpen) return;
    iframeWrapper.style.setProperty("--omnichat-top", viewport.offsetTop + "px");
    iframeWrapper.style.setProperty("--omnichat-height", viewport.height + "px");
  }
  if (viewport) {
    viewport.addEventListener("resize", fitMobileFrame);
    viewport.addEventListener("scroll", fitMobileFrame);
  }

  function setChatOpen(open) {
    isOpen = open;
    if (isOpen) {
      fitMobileFrame();
      iframeWrapper.classList.add("open");
      button.innerHTML = closeIcon;
    } else {
      iframeWrapper.classList.remove("open");
      button.innerHTML = chatIcon;
    }
  }

  button.addEventListener("click", function () {
    setChatOpen(!isOpen);
  });

  window.addEventListener("message", function (event) {
    if (event.data && typeof event.data === "object") {
      if (event.data.type === "omnichat-close") {
        setChatOpen(false);
      } else if (event.data.type === "omnichat-open") {
        setChatOpen(true);
      }
    }
  });

  container.appendChild(iframeWrapper);
  container.appendChild(button);
  document.body.appendChild(container);
})();
