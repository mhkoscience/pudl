let data;

const allStrings = []; 
let searchStrings = [];
const subjects = [];

let labels = [];
let filteredVideos;

const searchResults = document.getElementById('searchResults');
const resultsCountElement = document.getElementById("resultsCount");
const autocomplete = document.querySelector('.suggestions');

// Parsing data from csv file
promise = Papa.parse('data.csv', {
  header: true,
  delimiter: ";",
  download: true,
  dynamicTyping: true,
  complete: function(results) {
    data = results.data;
    data = data.slice(0,-1);
    data.forEach(e => {
      if (!(allStrings.includes(e.nazev.toLowerCase()))) { 
        allStrings.push(e.nazev.toLowerCase());
      };
      if (!(allStrings.includes(e.vyucujici.toLowerCase()))) { 
        allStrings.push(e.vyucujici.toLowerCase());
      };
      if (!(allStrings.includes(e.predmet.toLowerCase()))) { 
        allStrings.push(e.predmet.toLowerCase());
      };
      if (!(allStrings.includes(e.typ.toLowerCase()))) { 
        allStrings.push(e.typ.toLowerCase());
      };
      if (!(allStrings.includes(e.kod.toLowerCase()))) { 
        allStrings.push(e.kod.toLowerCase());
      };
      // add each keyword as a separate item
      const keywords = e.keywords.split(",");
      keywords.forEach(k => {
        if (!(allStrings.includes(k.toLowerCase()))) {
          allStrings.push(k.toLowerCase());
        };
      });

      if (!(subjects.includes(e.predmet))) { 
        subjects.push(e.predmet);
      };
    });    

    // generate list of předměty
    //console.log(subjects);
    subjects.forEach(subject => {
        //console.log(subject);
        $("#subjectList").append("<li>" + subject + "</li>");
    });

    $("#subjectList li").each(function () {
        var subjectLi = $(this);
        subjectLi.click(function () {
//            console.log(subjectLi.text());
            clearLabels();
            addLabelSubject(subjectLi.text());
            $("#subjects").toggle(200);
        });
    });

  }
});


const normalizeText = (text) => {
  if(!text || text === "")
    return "";

  return text.toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

const videoMatchesSearch = (video, query) => {
  const queryNormalized = normalizeText(query);
  return (
      normalizeText(video.odkaz).includes(queryNormalized) ||
      normalizeText(video.nazev).includes(queryNormalized) ||
      normalizeText(video.vyucujici).includes(queryNormalized) ||
      normalizeText(video.predmet).includes(queryNormalized) ||
      normalizeText(video.keywords).includes(queryNormalized) ||
      normalizeText(video.typ).includes(queryNormalized) ||
      normalizeText(video.kod).includes(queryNormalized)
  );
};

function refreshVideoList() {
  let filteredVideos = data;
  const queriesList = [...labels, ...searchStrings];

  if (queriesList.length > 0) {
    queriesList.forEach(label => {
      filteredVideos = filteredVideos.filter(video => videoMatchesSearch(video, label));
    });

    showVideos(filteredVideos);

  }
  else {
    showVideos([]);
  }
}

function refreshAutocomplete() {
  autocomplete.innerHTML = '';

  let filteredStrings = allStrings;
  searchStrings.forEach(searchString => {
    filteredStrings = filteredStrings.filter(dataItem => normalizeText(dataItem).includes(searchString))
  })

  const numberSuggestions = 5;
  filteredStrings.slice(0, numberSuggestions).forEach(function(suggested) {
    if (!(labels.includes(suggested))) {
      const div = document.createElement('div');
      div.classList.add('navrh');
      div.innerHTML = suggested;
      autocomplete.appendChild(div);
    }
  });

  const suggestions = document.getElementsByClassName('navrh');

  for (let i = 0; i < suggestions.length; i++) {
    autocomplete.id = 'full';
    suggestions[i].addEventListener('click', addLabel);
  }

  if (filteredStrings.length === 0){
    autocomplete.id = "empty";
  }
  
  if(searchStrings.length === 0) {
    autocomplete.innerHTML = '';
    autocomplete.id = "empty";
  }
}


const searchBar = document.getElementById('searchBar');
let debounceTimer;

searchBar.addEventListener('keyup', (e) => {
  if (debounceTimer)
    clearTimeout(debounceTimer);


  // wait 100 ms before refreshing autocomplete and videos
  debounceTimer = setTimeout(() => {
    const searchString = e.target.value.toLowerCase();

    // I don't understand how searchStrings should work, but they are unnecesary in current form
    // therefore they are being set to include just one item - search query
    // searchStrings = searchString.split(/[,]+/).filter(item => item.length > 0).map(item => normalizeText(item));
    searchStrings = [normalizeText(searchString)].filter(item => item.length > 0);

    refreshAutocomplete();
    refreshVideoList();

    // if search is empty, hide videos and results count
    if (searchStrings.length === 0 && labels.length === 0) {
      searchResults.innerHTML = '';
      refreshResultsCount(0);
    }
  }, 100);
});


const showVideos = (data) => {
  searchResults.innerHTML = data
      .map((video) => {
        const keywordsSeparated = video.keywords.replaceAll(",", ", ");
        return `
      <li class="videoResult" onclick="window.open('${video.odkaz}')">
                <div class="subjectAndTeacher">
                  <h2>${video.nazev}</h2>
                  <p>${video.vyucujici}</p>
                  <p>${video.predmet}<p>
                  <p>${video.typ}, ${video.tyden}. týden</p>
                </div>
                <div class="klicova_slova">
                <p><b>Klíčová slova:</b></br>${keywordsSeparated}</p>
                <p class="videoOdkaz">${video.odkaz}</p>
                </div>
      </li>
    `;
      })
      .join('');
  refreshResultsCount(data.length);
};


function refreshResultsCount(resultsCount, removeElementContent) {
  if(!removeElementContent)
    removeElementContent = (searchStrings.length === 0) && (labels.length === 0);

  if (resultsCount === 0 && removeElementContent){
    resultsCountElement.innerHTML = "";
    return;
  }

  resultsCountElement.innerHTML = "<p>vypudlováno " + resultsCount + " videí</p>";
}

function clearSearch(div) {
  div.getElementsByClassName("closing")[0].addEventListener("click", deleteLabel);
  const stitky = document.getElementById("labels");
  stitky.appendChild(div);
  autocomplete.innerHTML = "";
  autocomplete.id = "empty";
  document.getElementById("searchBar").value = "";
  searchStrings = [];
}

function addLabelElement(suggestion) {
  labels.push(suggestion);
  const div = document.createElement("div");
  div.classList.add("label");
  div.innerHTML = `
  <p>${suggestion}</p>
  <p class="closing">x</p>
  `;

  clearSearch(div);
}


function addLabel () {
  const suggestion = this.innerHTML;
  addLabelElement(suggestion);
  refreshVideoList();
}


function addLabelSubject (suggestion) {
  addLabelElement(suggestion);

  refreshVideoList()
}

function deleteLabel () {
  const suggestion = $(this).parent().children()[0].innerHTML;

  labels = labels.filter(value => {
    return value !== suggestion;
  });
  
  $(this).parent().remove();

  if (labels.length === 0) {
    $(".videoResult").remove();
    refreshResultsCount(0);
  }

  refreshVideoList();
}


function clearLabels() {
    $(".label").each(function () {
        $(this).remove();
    });
    labels = [];
    refreshResultsCount(0);
    refreshVideoList();
}


$(document).ready( function() {


    // pudl logo handling
    var tieBlue = "#00bfff";
    $("#pudlOff").click(function() {
        $("#logo").css("display", "none");
        return false;
    });

    $("#pudlWhite").click(function() {
        $("#logo").css("display", "inline-block");
        $("#logoHair").attr("fill", "white");
        $("#logoTie").attr("fill", tieBlue);
        $("#logoMouth").attr("fill", "black");
        $("#logoEyeRight").attr("fill", "black");
        $("#logoEyeLeft").attr("fill", "black");
        return false;
    });

    $("#pudlBlack").click(function() {
        $("#logo").css("display", "inline-block");
        $("#logoHair").attr("fill", "black");
        $("#logoTie").attr("fill", tieBlue);
        $("#logoMouth").attr("fill", "black");
        $("#logoEyeRight").attr("fill", "black");
        $("#logoEyeLeft").attr("fill", "black");
        return false;
    });

    function randColor() {
        randHex = Math.floor(Math.random()*16777214).toString(16);
        while (randHex.length < 6) {
            randHex = "0" + randHex;
        };
        return "#" + randHex;
    };

    $("#pudlRand").click(function() {
        $("#logo").css("display", "inline-block");
        $("#logoHair").attr("fill", randColor());
        $("#logoTie").attr("fill", randColor());
        $("#logoMouth").attr("fill", randColor());
        $("#logoEyeRight").attr("fill", randColor());
        $("#logoEyeLeft").attr("fill", randColor());
        return false;
    });

    // project description handling
    $("#toggleProject").click(function(){
        $("#aboutProject").toggle(200);
    });

    // list of subjects 
    $("#toggleSubjects").click(function(){
        $("#subjects").toggle(200);
    });
});


