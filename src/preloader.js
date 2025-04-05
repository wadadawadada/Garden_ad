(function(){
    var preloader = document.createElement("div");
    preloader.id = "preloader";
    preloader.style.position = "fixed";
    preloader.style.top = "0";
    preloader.style.left = "0";
    preloader.style.width = "100%";
    preloader.style.height = "100%";
    preloader.style.backgroundColor = "#000";
    preloader.style.zIndex = "9999";
    preloader.style.display = "flex";
    preloader.style.flexDirection = "column";
    preloader.style.justifyContent = "center";
    preloader.style.alignItems = "center";
    document.body.appendChild(preloader);
    var logo = document.createElement("img");
    logo.src = "/assets/logo.png";
    logo.style.maxWidth = "30%";
    logo.style.maxHeight = "30%";
    preloader.appendChild(logo);
    var percentage = document.createElement("div");
    percentage.style.position = "absolute";
    percentage.style.bottom = "150px";
    percentage.style.fontFamily = "helvetica, sans-serif";
    percentage.style.fontWeight = "bold";
    percentage.style.fontSize = "32px";
    percentage.style.color = "#fff";
    percentage.innerText = "0%";
    preloader.appendChild(percentage);
    var progress = 0;
    var interval = setInterval(function(){
      progress += 1;
      if(progress > 10) progress = 10;
      percentage.innerText = progress + "%";
      if(progress === 10){
        clearInterval(interval);
        logo.style.transition = "opacity 1s ease";
        percentage.style.transition = "opacity 1s ease";
        logo.style.opacity = "0";
        percentage.style.opacity = "0";
        setTimeout(function(){
          preloader.style.transition = "opacity 1s ease";
          preloader.style.opacity = "0";
          setTimeout(function(){
            document.body.removeChild(preloader);
            window.dispatchEvent(new Event("preloaderDone"));
          }, 500);
        }, 500);
      }
    },30);
  })();
  