(function() {
  if (window.zipchatWidgetLoaded) {
    return; // If already loaded, do not load again
  }

  // Track the current URL for SPA navigation detection
  let lastUrl = window.location.href;

  // Function to handle URL changes in SPAs
  function handleUrlChange() {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;

      // Clean up existing widget elements
      cleanupWidget();

      // Reload widget with the new URL
      loadWidget();

      // Re-setup URL change detection
      setupUrlChangeDetection();
    }
  }

  // Function to clean up the widget elements
  function cleanupWidget() {
    // Remove the iframe if it exists
    const iframe = document.getElementById('zipchat-iframe');
    if (iframe) {
      iframe.remove();
    }

    // Remove the chat container if it exists
    const container = document.getElementById('widget-chat-container');
    if (container) {
      container.remove();
    }

    // Clear the URL check interval if it exists
    if (window.zipchatUrlCheckInterval) {
      clearInterval(window.zipchatUrlCheckInterval);
      window.zipchatUrlCheckInterval = null;
    }

    // Reset the widget loaded flag
    window.zipchatWidgetLoaded = false;
  }

  // Set up URL change detection using non-invasive polling
  function setupUrlChangeDetection() {
    // Method 1: Listen for popstate event (back/forward navigation)
    window.addEventListener('popstate', handleUrlChange);

    // Method 2: Simple polling to check for URL changes (1000ms interval is responsive without being resource-intensive)
    const urlCheckInterval = setInterval(handleUrlChange, 1000);

    // Store the interval ID for cleanup
    window.zipchatUrlCheckInterval = urlCheckInterval;
  }

  function toggleBodyScroll(enable) {
    if (enable) {
      document.body.style.overflow = '';
    } else {
      document.body.style.overflow = 'hidden';
    }
  }

  function handleIframe(iframe, chatBubbleContainer, chatTrigger, svg, crossSvg) {
    if (chatBubbleContainer.querySelector("#close-preview-message")) {
      chatBubbleContainer.querySelector('#close-preview-message').click()
      if (!!chatTrigger?.conversation_message){
        iframe.contentWindow.postMessage(
            { action: "getConversationMessage", origin: window.location.origin,
             message: chatTrigger.conversation_message},
            "*"
        );
      }
    }

    if (iframe.style.opacity == 1) {
      iframe.style.transform = "scale(0)";
      iframe.style.opacity = "0";
      iframe.style.pointerEvents = 'none';
      if (window.innerWidth <= 768) {
        toggleBodyScroll(true);
      }
      // Swap SVGs
      svg.style.display = "block";
      crossSvg.style.display = "none";
    } else {
      iframe.style.transform = "scale(1)";
      iframe.style.opacity = "1";
      iframe.style.pointerEvents = 'all';
      iframe.contentWindow.postMessage(
        { action: "scrollToBottom", origin: window.location.origin },
        "*"
      );
      if (window.innerWidth <= 768) {
        toggleBodyScroll(false);
        document.body.style.position = "static";
        document.body.style.inset = "0px";
        document.body.style.margin = "0px";
      }
      // Swap SVGs
      svg.style.display = "none";
      crossSvg.style.display = "block";
    }
  }

  function createLoadingSpinner(chatBubbleIcon) {
    // Create loading spinner
    var loaderSpan = document.createElement('span');
    loaderSpan.className = 'widget-chat-loader';

    // Append loading spinner
    chatBubbleIcon.appendChild(loaderSpan);

    // Create style element
    var style = document.createElement('style');
    style.innerHTML = `
      .widget-chat-loader {
        width: 24px;
        height: 24px;
        border: 3px solid #FFF;
        border-bottom-color: transparent;
        border-radius: 50%;
        display: inline-block;
        box-sizing: border-box;
        animation: rotation 1s linear infinite;
      }

      @keyframes rotation {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }
    `;

    // Append style to the document's head
    document.head.appendChild(style);

    return loaderSpan;
  }

  // Create chatbot iframe
  function createChatbotIframe(
    bubble,
    url,
    widgetHorizontal,
    widgetVertical,
    widgetCorner,
    widgetZIndex,
    chatBubbleSizeDifference,
    chatBubbleContainer,
    chatTrigger,
    chatBubbleIcon,
    svg,
    crossSvg
  ) {
    let chatbotIframe = document.getElementById('zipchat-iframe');
    if (!chatbotIframe) {
      svg.style.display = "none";

      const visitorWidth = window.innerWidth;

      const urlObject = new URL(url);
      urlObject.searchParams.append('visitor_width', visitorWidth);
      url = urlObject.toString();

      // Show loading spinner
      const loaderSpan = createLoadingSpinner(chatBubbleIcon);

      chatbotIframe = document.createElement('iframe');
      chatbotIframe.setAttribute('id', 'zipchat-iframe');
      chatbotIframe.classList.add("zipchat-iframe");
      chatbotIframe.src = url;
      chatbotIframe.style.maxheight = '700px';
      chatbotIframe.style.border = 'none';
      chatbotIframe.style.opacity = "0"
      chatbotIframe.style.transform = "scale(0)";

      if (bubble === 'whatsapp') {
        chatbotIframe.style.height = "520px"
      } else {
        chatbotIframe.style.height = `min(704px, 100% - ${84 + widgetVertical}px - ${chatBubbleSizeDifference}px)`;
      }

      chatbotIframe.style.position = 'fixed';
      chatbotIframe.style.pointerEvents = 'none';
      chatbotIframe.style.fontSize = '16px';
      chatbotIframe.style.boxShadow = "0 6px 6px 0 rgba(0,0,0,.02),0 8px 24px 0 rgba(0,0,0,.12)";
      chatbotIframe.style.transformOrigin = widgetCorner.replace('-',' ');
      chatbotIframe.style.transition = "transform 0.3s cubic-bezier(0, 1.2, 1, 1), opacity 0.2s ease-out";

      if (window.innerWidth <= 768) {
        chatbotIframe.style.top = '0';
        chatbotIframe.style.bottom = '0';
        chatbotIframe.style.width = '100%';
        chatbotIframe.style.height = '100%';
        chatbotIframe.style.zIndex = widgetZIndex;
      } else {
        const horizontal = `${widgetHorizontal}px`;
        if (widgetCorner.includes('right')) {
          chatbotIframe.style.right = horizontal;
        } else {
          chatbotIframe.style.left = horizontal;
        }

        const vertical = `${widgetVertical + 60 + chatBubbleSizeDifference}px`;

        if (widgetCorner.includes('bottom')) {
          chatbotIframe.style.bottom = vertical;
        } else {
          chatbotIframe.style.top = vertical;
        }

        chatbotIframe.style.width = '400px';
        chatbotIframe.style.zIndex = widgetZIndex;
        chatbotIframe.style.borderRadius = "0.75rem"
      }
      // Hide the spinner when the iframe has finished loading
      document.body.appendChild(chatbotIframe);
      chatbotIframe.onload = function() {
        // Hide loading spinner
        chatBubbleIcon.removeChild(loaderSpan);
        handleIframe(chatbotIframe, chatBubbleContainer, chatTrigger, svg, crossSvg)
      };
    } else {
      handleIframe(chatbotIframe, chatBubbleContainer, chatTrigger, svg, crossSvg)
    }
  }

  function modernWhatsappIcon(backgroundColor) {
    let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svg.setAttribute('fill', backgroundColor);
    svg.setAttribute('viewBox', '0 0 35 35');
    svg.setAttribute('width', '25');
    svg.setAttribute('height', '25');

    let path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('fill-rule', 'evenodd');
    path.setAttribute('clip-rule', 'evenodd');
    path.setAttribute('d', 'M29.9003 5.08601C26.6106 1.80788 22.2353 0.00166318 17.5735 0C7.96746 0 0.149573 7.77954 0.14623 17.342C0.144559 20.3989 0.947573 23.3826 2.47255 26.0122L0 35L9.23841 32.5884C11.7836 33.9705 14.6497 34.6981 17.566 34.699H17.5735C27.1779 34.699 34.9967 26.9186 35 17.3561C35.0017 12.7217 33.1909 8.36498 29.9003 5.08684V5.08601ZM17.5735 31.7701H17.5677C14.9689 31.7693 12.4196 31.074 10.1952 29.761L9.66624 29.4484L4.18386 30.8795L5.647 25.5597L5.30272 25.0142C3.85296 22.7191 3.08671 20.0662 3.08838 17.3429C3.09172 9.39532 9.58936 2.92886 17.5794 2.92886C21.4482 2.93053 25.0848 4.43155 27.8197 7.15668C30.5546 9.88098 32.0595 13.5034 32.0579 17.3545C32.0545 25.3029 25.5569 31.7693 17.5735 31.7693V31.7701ZM25.5184 20.9744C25.083 20.7574 22.9423 19.7095 22.5428 19.5649C22.1434 19.4201 21.8535 19.3478 21.5635 19.7819C21.2736 20.216 20.4388 21.1923 20.1848 21.4808C19.9308 21.7702 19.6767 21.806 19.2413 21.5889C18.8061 21.3719 17.4031 20.9145 15.7394 19.4384C14.4451 18.2891 13.571 16.8705 13.317 16.4364C13.063 16.0023 13.2903 15.7678 13.5075 15.5524C13.703 15.3578 13.9428 15.046 14.1609 14.7932C14.3791 14.5403 14.4509 14.3591 14.5963 14.0705C14.7417 13.7811 14.669 13.5284 14.5604 13.3113C14.4517 13.0942 13.5811 10.9612 13.2176 10.0938C12.8641 9.24896 12.5048 9.36372 12.2382 9.34958C11.9842 9.3371 11.6943 9.33462 11.4035 9.33462C11.1127 9.33462 10.6414 9.44272 10.242 9.87682C9.84258 10.3109 8.71783 11.3595 8.71783 13.4917C8.71783 15.6239 10.2779 17.6855 10.496 17.9749C10.7141 18.2643 13.5668 22.6409 17.9345 24.5187C18.9732 24.9652 19.7845 25.2321 20.4171 25.4317C21.46 25.7619 22.4091 25.7153 23.1595 25.6039C23.996 25.4791 25.7357 24.5552 26.0983 23.5432C26.461 22.5311 26.461 21.6629 26.3524 21.4825C26.2438 21.302 25.953 21.1931 25.5176 20.976L25.5184 20.9744Z');
    path.setAttribute('fill', 'white');

    svg.appendChild(path);

    return svg;
  }

  // Create modern chat icon svg
  function modernZipchatIcon(newSize) {
    let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('viewBox', '0 0 21 25');
    svg.setAttribute('width', `${newSize}px`);
    svg.setAttribute('height', `${newSize}px`);

    var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('fill-rule', 'evenodd');
    path.setAttribute('clip-rule', 'evenodd');
    path.setAttribute('d', 'M3.60412 0H10.466C10.466 5.74692 5.77465 10.4158 0 10.4158V3.58681C0 1.60705 1.61481 0 3.60412 0ZM10.47 0H15.697C18.5843 0 20.932 2.33243 20.932 5.20589C20.932 8.07935 18.5884 10.4118 15.701 10.4118H10.47V0ZM10.466 10.4216V20.726C10.5239 15.0284 15.1888 10.4175 20.9315 10.4175V20.8172H20.9322V25.0012C18.7149 22.0639 17.1702 20.975 11.7682 20.8333H10.466V20.8334H5.235C2.34767 20.8334 0.00398982 18.501 0.00398982 15.6275C0.00398982 12.754 2.34767 10.4216 5.235 10.4216H10.466Z');
    path.setAttribute('fill', 'white');

    svg.appendChild(path);

    return svg;
  }

  // Create classic chat icon svg
  function classicZipchatIcon(newSize) {
    let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('stroke-width', '1.5');
    svg.setAttribute('stroke', '#ffffff');
    svg.setAttribute('width', `${newSize}px`);
    svg.setAttribute('height', `${newSize}px`);
    svg.setAttribute('style', `width:${newSize}px;height:${newSize}px;fill:none;`);

    var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('d', 'M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337');
    svg.setAttribute('fill', 'none');

    svg.appendChild(path);

    return svg;
  }

  // Create custom chat icon
  function customZipchatIcon(bubbleIconUrl, newImageSize) {
    let img = document.createElement('img');
    img.setAttribute('src', bubbleIconUrl);
    img.setAttribute('alt', 'Custom chat icon');
    img.setAttribute('width', `${newImageSize}px`);
    img.setAttribute('height', `${newImageSize}px`);
    img.setAttribute('border-radius', '50%');
    return img;
  }

  // Create chat icon svg
  function createChatIcon(bubble, bubbleIconType, color, newSize, bubbleIconUrl, newImageSize) {
    if (bubble === 'whatsapp') {
      return modernWhatsappIcon(color);
    } else {
      if (bubbleIconType === 'modern') {
        return modernZipchatIcon(newSize);
      } else if (bubbleIconType === 'classic') {
        return classicZipchatIcon(newSize);
      } else if (bubbleIconType === 'custom') {
        return customZipchatIcon(bubbleIconUrl, newImageSize);
      }
    }
  }

  function loadWidget() {
    var scriptTag = document.querySelector('script[src*="zipchat.js"]');
    var widgetToken = new URL(scriptTag.src).searchParams.get('id');
    let widgetConfigurationUrl, chatbotUrl, baseUrl;

    const currentUrl = window.location.href;

    // if current url include params zipchat-preview=true remove the chatPreviewMessageHidden flag
    if (currentUrl.includes('zipchat-preview=true')) {
      console.log('zipchat-preview=true');
      localStorage.removeItem('chatPreviewMessageHidden');
    }

    // Not running as Shopify theme app extension
    if (widgetToken) {
      let baseUrl = scriptTag.src.replace(`/widget/zipchat.js?id=${widgetToken}`, '/widget_data');
      // Case when shopify is loading the script tag, we need to remove the &shop parameter
      const shopParamIndex = baseUrl.indexOf('&shop=');
      if (shopParamIndex !== -1) {
        baseUrl = baseUrl.substring(0, shopParamIndex);
      }

      widgetConfigurationUrl = new URL(baseUrl);
      widgetConfigurationUrl.searchParams.append('widget_token', widgetToken);
    } else {
      widgetConfigurationUrl = new URL(window.location.origin + '/apps/zipchat/widget/configuration');
    }
    widgetConfigurationUrl.searchParams.append('current_url', currentUrl);

    const visitorWidth = window.innerWidth;
    widgetConfigurationUrl.searchParams.append('visitor_width', visitorWidth);

    fetch(widgetConfigurationUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })
      .then(response => response.json())
      .then(data => {
        var widgetData = data;
        var widgetCorner = widgetData.widget_position_corner;
        var widgetHorizontal = widgetData.widget_horizontal;
        var widgetVertical = widgetData.widget_vertical;
        var widgetSize = widgetData.widget_size;
        const chatTrigger = widgetData.chat_trigger
        const widgetZIndex = widgetData.z_index;

        if (widgetData.widget == false) {
          return
        }

        const sizeMap = {
          'small': 0,
          'medium': 10,
          'large': 20
        };
        const chatBubbleSizeDifference = sizeMap[widgetSize] || 0;


        var chatPreviewMessage = document.createElement('div');
        chatPreviewMessage.setAttribute('id', 'chat-preview-message');
        chatPreviewMessage.style.paddingTop = '10px';
        chatPreviewMessage.style.paddingBottom = '10px';
        chatPreviewMessage.style.fontFamily = 'sans-serif;'
        chatPreviewMessage.style.color = 'black'
        chatPreviewMessage.style.paddingLeft = '16px';
        chatPreviewMessage.style.paddingRight = '16px';
        chatPreviewMessage.style.boxShadow = 'rgba(0, 0, 0, 0.2) 0px 4px 8px 0px';
        const horizontalPreview = `${widgetHorizontal}px`;
        if (widgetCorner.includes('right')) {
          chatPreviewMessage.style.right = horizontalPreview;
        } else {
          chatPreviewMessage.style.left = horizontalPreview;
        }
        const verticalPreview = `${widgetVertical + 55 + chatBubbleSizeDifference}px`;
        if (widgetCorner.includes('bottom')) {
          chatPreviewMessage.style.bottom = verticalPreview;
        } else {
          chatPreviewMessage.style.top = verticalPreview;
        }
        chatPreviewMessage.style.width = '300px';
        chatPreviewMessage.style.maxWidth = '300px';
        chatPreviewMessage.style.backgroundColor = 'white';
        chatPreviewMessage.style.height = 'auto';
        chatPreviewMessage.style.position = 'fixed';
        chatPreviewMessage.style.zIndex = widgetZIndex;
        chatPreviewMessage.style.display = "none"
        chatPreviewMessage.style.borderRadius = "12px"
        chatPreviewMessage.style.transition = "transform 0.3s cubic-bezier(0, 1.2, 1, 1), opacity 0.2s ease-out";

        function linkifyMessage(text) {
          const urlRegex = /https:\/\/[^\s]+/g;
          return text.replace(urlRegex, function(url) {
              return '<a href="' + url + '">' + url + '</a>';
          });
        }

        const imageElement = widgetData.photo_url ? `
        <div style="flex-shrink: 0;">
            <img id="photo-preview" alt="Photo preview" style="border-radius: 9999px; max-height: 32px;" width="32" height="32" data-chat-bot-show-target="photoSmallPreview" src="${widgetData.photo_url}">
        </div>` : '';

        const gapStyle = widgetData.photo_url ? 'gap: 12px;' : '';

        chatPreviewMessage.innerHTML = `
              <div style="">
                  <div id="brand-name" style="font-weight: bold; padding: 4px 0; background-color: white; font-family: sans-serif;">
                      <div style="display: flex; align-items: center; ${gapStyle}; margin-bottom: 4px;">
                          ${imageElement}
                          <div style="flex: 1;">
                              <div style="line-height: 16px;">
                                  <p style="letter-spacing: 0px; margin: 0; font-size: 14px; font-weight: 600;" data-chat-bot-show-target="brandNameSmallPreview">${widgetData.brand_name}</p>
                                  <div style="display: inline-flex; align-items: center;">
                                      <div style="display: block; width: 8px; height: 8px; background-color: #22c55d; border-radius: 9999px; margin-right: 4px;"></div>
                                      <p style="margin: 0; font-weight: 300; font-size: 12px;">Active</p>
                                  </div>
                              </div>
                          </div>
                          <div style="line-height: 16px; display: flex; color: #bdbdbd;justify-content: flex-end; cursor: pointer;" id="close-preview-message">
                              <svg style="width: 20px; height: 20px; top: 16px;" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" style="fill:none;"></path>
                              </svg>
                          </div>
                      </div>
                  </div>

              <div style="line-height: 16px; letter-spacing: 0.2px; font-family: sans-serif; color: #6B7280; font-size: 12px;" data-chat-bot-show-target="welcomeSmallPreviewMessageText">${chatTrigger?.popup_message ? linkifyMessage(chatTrigger.popup_message) : ''}</div>
          </div>
        `

        // Not running as Shopify theme app extension
        if (widgetToken) {
          baseUrl = scriptTag.src.replace(`/widget/zipchat.js?id=${widgetToken}`, '/widget');
          // Case when shopify is loading the script tag, we need to remove the &shop parameter
          const shopParamIndex = baseUrl.indexOf('&shop=');
          if (shopParamIndex !== -1) {
            baseUrl = baseUrl.substring(0, shopParamIndex);
          }

          chatbotUrl = new URL(baseUrl);
        } else {
          chatbotUrl = new URL(`${data.api_base}/widget`);
        }
        chatbotUrl.searchParams.append('current_url', currentUrl);

        // Append the token to the chatbot URL
        function generateRandomString(length) {
          var result = '';
          var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
          for (var i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
          }
          return result;
        }

        var visitor_token = localStorage.getItem('visitor_token');
        if (!visitor_token) {
          visitor_token = generateRandomString(20);
          localStorage.setItem('visitor_token', visitor_token);
        }

        chatbotUrl.searchParams.append('visitor_token', visitor_token);
        chatbotUrl.searchParams.append('widget_token', data.widget_token);

        // Create the chat bubble container
        var chatBubbleContainer = document.createElement('div');
        chatBubbleContainer.setAttribute('id', 'widget-chat-container');

        // chatBubbleContainer.style.opacity = "0"

        // Create the chat bubble button
        var chatBubbleButton = document.createElement('div');
        chatBubbleButton.setAttribute('id', 'widget-chat-button');
        chatBubbleButton.style.position = 'fixed';
        chatBubbleButton.style.width = `${50 + chatBubbleSizeDifference}px`;
        chatBubbleButton.style.height = `${50 + chatBubbleSizeDifference}px`;
        chatBubbleButton.style.borderRadius = '50%';
        chatBubbleButton.style.backgroundColor = widgetData.color;
        chatBubbleButton.style.boxShadow = 'rgba(0, 0, 0, 0.2) 0px 4px 8px 0px';
        chatBubbleButton.style.cursor = 'pointer';
        chatBubbleButton.style.zIndex = widgetZIndex;
        chatBubbleButton.style.transition = 'all 0.2s ease-in-out 0s';

        // ::before content can only be added via CSS
        if (widgetData.bubble === 'whatsapp') {
          const style = document.createElement('style');
          style.textContent = `
            #widget-chat-button::before {
              content: "";
              position: absolute;
              top: 3px;
              right: 2px;
              background: red;
              border-radius: 50%;
              width: 10px;
              height: 10px;
            }
          `;
          document.head.appendChild(style);
        }

        let horizontalPosition = widgetCorner.includes("right") ? "right" : "left";
        let verticalPosition = widgetCorner.includes("bottom") ? "bottom" : "top";

        chatBubbleButton.style[horizontalPosition] = `${widgetHorizontal}px`;
        chatBubbleButton.style[verticalPosition] = `${widgetVertical}px`;

        var chatBubbleIcon = document.createElement('div');
        chatBubbleIcon.style.display = 'flex';
        chatBubbleIcon.style.alignItems = 'center';
        chatBubbleIcon.style.justifyContent = 'center';
        chatBubbleIcon.style.width = '100%';
        chatBubbleIcon.style.height = '100%';
        chatBubbleIcon.style.zIndex = widgetZIndex;
        chatBubbleIcon.style.borderRadius = '100%';
        chatBubbleIcon.style.overflow = 'hidden';

        // dynamically change the svgs size based on the widget size
        const svgSizeMap = {
          'small': 0,
          'medium': 6,
          'large': 12
        };
        const svgSizeDifference = svgSizeMap[widgetSize] || 0;
        const baseSize = 24;
        const newSize = baseSize + svgSizeDifference;
        const newImageSize = 52 + chatBubbleSizeDifference;

        // chat svg icon
        var svg = createChatIcon(
          widgetData.bubble,
          widgetData.bubble_icon_type || "modern",
          widgetData.color,
          newSize,
          widgetData.bubble_icon_url,
          newImageSize,
        );

        // close svg icon
        var crossSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        crossSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        crossSvg.setAttribute("fill", "none");
        crossSvg.setAttribute("viewBox", "0 0 24 24");
        crossSvg.setAttribute("stroke-width", "1.5");
        crossSvg.setAttribute("stroke", "#ffffff");
        crossSvg.setAttribute("width", `${newSize}px`);
        crossSvg.setAttribute("height", `${newSize}px`);
        crossSvg.setAttribute('style', `width:${newSize}px;height:${newSize}px;fill:none;`);

        var crossPath1 = document.createElementNS("http://www.w3.org/2000/svg", "path");
        crossPath1.setAttribute("stroke-linecap", "round");
        crossPath1.setAttribute("stroke-linejoin", "round");
        crossPath1.setAttribute("d", "M6 18L18 6M6 6l12 12");

        crossSvg.appendChild(crossPath1);


        // Append the SVG to the chat bubble icon
        chatBubbleIcon.appendChild(svg);
        // Appen the cross svg that we will hide and show
        crossSvg.style.display = "none";
        chatBubbleIcon.appendChild(crossSvg)

        // Append the chat bubble icon to the chat bubble button
        chatBubbleButton.appendChild(chatBubbleIcon);

        // Append the chat bubble button to the user's website
        document.body.appendChild(chatBubbleContainer);

        chatBubbleContainer.appendChild(chatBubbleButton);

        document.querySelector("#widget-chat-button").addEventListener("mousedown", function (event) {
          event.stopPropagation();
          document.getElementById("widget-chat-button").style.transform = "scale(0.7)";
        });

        document.querySelector("#widget-chat-button").addEventListener("mouseup", function (event) {
          event.stopPropagation();
          document.getElementById("widget-chat-button").style.transform = "scale(1)";
        });

        if (!localStorage.getItem('chatPreviewMessageHidden') && !!chatTrigger?.popup_message) {
          chatBubbleContainer.appendChild(chatPreviewMessage);

          chatBubbleContainer.querySelector('#chat-preview-message').addEventListener("click", function (event) {
            if (event.target.nodeName === 'A') {
              return;
            }

            event.stopPropagation();
            var chatPreviewMessage = document.querySelector('#chat-preview-message');
            chatPreviewMessage.style.transform = "scale(0)";
            chatPreviewMessage.style.display = 'none'
            document.querySelector("#widget-chat-button").click();
        });

          function showChatPreviewMessage() {
            chatPreviewMessage.style.transform = "scale(1)";
            chatPreviewMessage.style.opacity = "1";
            chatPreviewMessage.style.display = "";
          }

          function hideChatPreviewMessage() {
            chatPreviewMessage.style.transform = "scale(0)";
            chatPreviewMessage.style.display = 'none'
            chatPreviewMessage.remove()
          }

          function showPreviewMessageByTime(delay, callback){
            setTimeout(() => {
              callback();
              }, delay);
          }

          function showPreviewMessageByScrollPercentage(thresholdPercentage, callback){
              window.addEventListener('scroll', function() {
                const scrollTop = window.scrollY || document.documentElement.scrollTop;
                const windowHeight = window.innerHeight || document.documentElement.clientHeight;
                const documentHeight = document.documentElement.scrollHeight;

                const scrollPercentage = (scrollTop + windowHeight) / documentHeight * 100;

                if (scrollPercentage >= thresholdPercentage) {
                    callback();
                    window.removeEventListener('scroll', arguments.callee);
                }
            });
          }

          chatBubbleContainer.querySelector('#close-preview-message').addEventListener("click", function (event) {
            event.stopPropagation();
            hideChatPreviewMessage();

            // Set the localStorage flag to prevent showing the chat preview message again
            localStorage.setItem('chatPreviewMessageHidden', 'true');
          });

          if (!!chatTrigger && chatTrigger.setup_type == 'advanced'){
            if (chatTrigger.all_rules_met && (!!chatTrigger.show_after_scroll_percentage && !!chatTrigger.show_after_seconds)){
              showPreviewMessageByScrollPercentage(chatTrigger.show_after_scroll_percentage,
                                 () => showPreviewMessageByTime(chatTrigger.show_after_seconds * 1000, showChatPreviewMessage))
            }
            else {
              if (!!chatTrigger.show_after_scroll_percentage){
                showPreviewMessageByScrollPercentage(chatTrigger.show_after_scroll_percentage, showChatPreviewMessage)
              }
              if (!!chatTrigger.show_after_seconds){
                showPreviewMessageByTime(chatTrigger.show_after_seconds * 1000, showChatPreviewMessage)
              }
            }
          }
          else {
            showPreviewMessageByTime(2000, showChatPreviewMessage)
          }
        }

        // Opening closing the chatbot when cliking on the widget button
        document.querySelector("#widget-chat-button").addEventListener("click", function (event) {
          event.stopPropagation();
          createChatbotIframe(
            widgetData.bubble,
            chatbotUrl.toString(),
            widgetHorizontal,
            widgetVertical,
            widgetCorner,
            widgetZIndex,
            chatBubbleSizeDifference,
            chatBubbleContainer,
            chatTrigger,
            chatBubbleIcon,
            svg,
            crossSvg
          );
        });


        // On mobile, I added a 'x' to close the chatbot, because it's in the iframe, I need to do a post message
        window.addEventListener('message', function(event) {
          if (event.origin !== event.data.origin) {
            return;
          }
          var iframe = document.getElementById("zipchat-iframe");
          if (event.data.action === 'close-iframe') {
            iframe.style.transform = "scale(0)";
            iframe.style.opacity = "0";
            iframe.style.pointerEvents = 'none';

            svg.style.display = "block";
            crossSvg.style.display = "none";
            toggleBodyScroll(true)
            document.body.style.position = "";
            document.body.style.inset = "";
            document.body.style.margin = "";
          }
          if (event.data.action === 'remove-iframe') {
            iframe.remove()
            document.getElementById("widget-chat-button").remove()
          }

        });

        // If the clicked element is neither the chat button nor the iframe itself, close the iframe.
        window.addEventListener("click", function(event) {
          var iframe = document.getElementById("zipchat-iframe");
          var chatButton = document.getElementById("widget-chat-button");
          if (event.target !== chatButton && event.target !== iframe && iframe) {
            iframe.style.transform = "scale(0)";
            iframe.style.opacity = "0";
            iframe.style.pointerEvents = 'none';
            svg.style.display = "block";
            crossSvg.style.display = "none";
            toggleBodyScroll(true)
          }
        });
        window.zipchatWidgetLoaded = true;

      })
      .catch(error => {
        console.error('Error fetching data:', error);
      });
  }

  if (document.readyState === 'loading') {
    // If the document is still loading, wait for DOMContentLoaded
    document.addEventListener('DOMContentLoaded', function() {
      loadWidget();
      setupUrlChangeDetection();
    });
  } else {
    // If the document has already finished loading, we can run the function now
    loadWidget();
    setupUrlChangeDetection();
  }
})();
