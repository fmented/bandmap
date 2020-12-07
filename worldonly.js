async function getGeo() {
  //target.innerHTML = `<h1 style="padding-top:${screen.height/3.5}px; text-align:center;">Please Wait...</h1>`
  target.innerHTML =
    '<div class="lds-ring"><div></div><div></div><div></div></div>';
  var geo = await fetch("./countries.geojson", {
    cache: "force-cache",
  }).then((res) => res.json());
  var features = geo.features;
  window.geofeatures = features;
  target.removeChild(target.childNodes[0]);
}

var styles = {
  opacity: 1,
  color: "#ee1122",
  fillColor: "#222222",
  fillOpacity: 1,
  weight: 0.5,
};

function randomColor() {
  return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
}

var target = document.querySelector("#map");
var map;
var layerSelected;
var ctext;
async function init() {
  await getGeo();

  map = L.map(target, {
    center: [0, 0],
    zoom: 1,
    retina: true,
    // maxZoom: 2
  });

  // map.doubleClickZoom.disable()
  // map.scrollWheelZoom.disable()

  map.on("mousedown", function () {
    if (sessionStorage.getItem("genre") == selectedGenre) {
      w.setStyle(styles);
      indicator.innerText = "No Country Selected";
    }
  });
  map.on("mouseover", function () {
    if (selected == false && checkBar()) {
      w.setStyle(styles);
      indicator.innerText = "No Country Selected";
    }
  });

  map.attributionControl.setPrefix(
    '<a href="https://leafletjs.com" target="_blank" style="color:#666;">Leaflet</a> | <a href="https://musicbrainz.org" target="_blank" style="color:#666;">Musicbrainz</a> | <a href="https://open.spotify.com/artist/5JEvywYloyf0QPHBEyBQlO" target="_blank" style="color:#666;">Fmented</a>'
  );
  bar.onmouseover = function () {
    selected = false;
  };

  var selected = false;
  var w = L.geoJSON(window.geofeatures, {
    style: styles,
    onEachFeature: function (feature, layer) {
      layer.on("click", async function (e) {
        w.setStyle(styles);
        var origin = feature.properties.ISO_A2;
        sessionStorage.setItem("origin", origin);
        layerSelected = this;
        ctext = feature.properties.ADMIN;
        let i = await fetch(
          `https://musicbrainz.org/ws/2/artist/?query=tag:${selectedGenre}%20AND%20country:${sessionStorage.getItem(
            "origin"
          )}&inc=url-rels&fmt=json`
        ).then((res) => {
          if (res.status == 200) {
            return res.json();
          }
        });
        let list = i.artists;
        await addBandlist(list);
        this.setStyle({ color: "gold", fillColor: "#eee" });
        indicator.innerText = feature.properties.ADMIN;
      });
      layer.on("mouseup", function (e) {
        w.setStyle(styles);
        selected = true;
      });
      layer.on("mouseover", function () {
        if (selected == false) {
          this.setStyle({ color: "red", fillColor: "#999" });
        }
        indicator.innerText = feature.properties.ADMIN;
      });
      layer.on("mouseout", function () {
        if (selected != true) {
          w.setStyle(styles);
        }
        if (layerSelected != undefined) {
          layerSelected.setStyle({ color: "gold", fillColor: "#eee" });
          indicator.innerText = ctext;
        }
      });
    },
  }).addTo(map);
}

async function addBandlist(list) {
  if (bar.childElementCount == 3) {
    bar.removeChild(bar.children[2]);
  }
  if (bar.childElementCount == 2) {
    bar.removeChild(bar.children[1]);
  }
  let c = document.createElement("div");
  c.style.display = "flex";
  c.style.overflowX = "scroll";
  c.classList.add("list");
  list.forEach(async function (band) {
    let container = document.createElement("div");
    container.classList.add("card");
    container.style.justifyContent = "center";
    let c_con = document.createElement("div");
    c_con.classList.add("card-base");
    let b = document.createElement("h2");
    b.classList.add("band");
    b.innerText = band.name;
    b.style.cursor = "pointer";
    b.onclick = async function () {
      await addAlbumlist(band.id, band.name);
    };
    b.ondblclick = function () {
      window.open(`https://musicbrainz.org/artist/${band.id}`, "_blank");
    };
    b.setAttribute(
      "title",
      `Click: Check ${band.name} Releases\nDouble-Click: Find More About ${band.name}`
    );
    c_con.append(b);
    container.appendChild(c_con);
    c.appendChild(container);
  });
  c.style.width =
    screen.width -
    parseInt(window.getComputedStyle(filter)["width"].replace("px", "")) -
    32 +
    "px";
  bar.appendChild(c);
}

async function checkCover(group_id) {
  let group = await fetch(
    `https://musicbrainz.org/ws/2/release?release-group=${group_id}&fmt=json`,
    {}
  ).then((res) => {
    if (res.status == 200) {
      return res.json();
    }
  });
  let releases = group.releases;
  return await getImageSource(releases);
}

async function getImageSource(releases) {
  for (let index = 0; index < releases.length; index++) {
    let r = releases[index];
    if (r["cover-art-archive"].artwork == true) {
      let src = await fetch(
        `https://coverartarchive.org/release/${r.id}`,
        {}
      ).then((res) => {
        if (res.status == 200) {
          return res.json();
        }
      });
      return [src.images[0].image, r.id];
    }
  }
  return ["./noimage.png", releases[releases.length - 1].id];
}

async function addAlbumlist(artist, _name) {
  bar.children[1].style.display = "none";
  let c = document.createElement("div");
  c.classList.add("list");
  let i = await fetch(
    `https://musicbrainz.org/ws/2/release-group?artist=${artist}&fmt=json`,
    {}
  ).then((res) => {
    if (res.status == 200) {
      return res.json();
    }
  });
  let albumlist = await i["release-groups"];
  c.style.display = "flex";
  let b = document.createElement("button");
  b.innerText = ">>";
  b.classList.add("band");
  b.classList.add("collapse");
  b.setAttribute("title", "Collapse");
  b.onclick = function () {
    bar.children[1].style.display = "flex";
    bar.removeChild(c);
  };
  c.appendChild(b);
  bar.appendChild(c);
  let w1 = window.getComputedStyle(filter)["width"].replace("px", "");
  let w2 = window.getComputedStyle(b)["width"].replace("px", "");
  let w = screen.width - parseInt(w1) - parseInt(w2) - 50;
  let h = window.getComputedStyle(filter)["height"].replace("px", "");
  if (albumlist.length == 0) {
    let a = document.createElement("div");
    a.style.display = "block";
    a.style.width = w + "px";
    a.style.textAlign = "center";
    a.style.paddingTop = Math.floor(parseInt(h) / 2) + "px";
    a.innerText = "No Album Yet";
    c.appendChild(a);
  } else {
    let x = document.createElement("div");
    x.style.display = "flex";
    x.style.width = w + "px";
    x.style.overflowX = "scroll";
    x.style.overflowY = "hidden";
    x.classList.add("list");
    albumlist.forEach(async function (_album) {
      let container = document.createElement("div");
      container.classList.add("card-base");
      let card = document.createElement("div");
      card.classList.add("card");
      let a = document.createElement("img");
      let src = await checkCover(_album.id);
      a.src = src[0];
      a.height = h * 0.7;
      a.width = h * 0.7;
      a.classList.add("band");
      a.style.cursor = "pointer";
      a.setAttribute("title", "More Information");
      a.onclick = function () {
        window.open(`https://musicbrainz.org/release/${src[1]}`, "_blank");
      };
      card.appendChild(a);

      let name = document.createElement("p");
      name.innerText = _album.title;
      name.style.cursor = "pointer";
      name.setAttribute("title", "Search on Spotify");
      name.onclick = function () {
        window.open(
          `https://open.spotify.com/search/${_name} ${_album.title}`,
          "_blank"
        );
      };
      card.appendChild(name);
      container.appendChild(card);
      x.appendChild(container);
    });
    c.appendChild(x);
  }
}

init();
var bar = document.querySelector(".bottom-bar");
var filter = document.querySelector("#filter");
var selectedGenre = filter.value;
var indicator = document.querySelector("#indicator");

filter.onchange = async function () {
  selectedGenre = this.value;
  if (layerSelected != undefined) {
    layerSelected.fire("click");
    layerSelected.setStyle({ color: "gold", fillColor: "#eee" });
  }
};

function checkBar() {
  return bar.children.length < 2;
}
