let data;

const allStrings = new Array; 
const searchStrings = new Array;
const subjects = new Array;

let labels = new Array;
let filteredVideos;

const searchResults = document.getElementById('searchResults');
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
            console.log(subjectLi.text());
            clearLabels();
            addLabelSubject(subjectLi.text());
            $("#subjects").toggle(200);
        });
    });

  }
});




const searchBar = document.getElementById('searchBar');

searchBar.addEventListener('keyup', (e) => {
  const searchString = e.target.value.toLowerCase();

  searchStrings.push(searchString);

  searchStrings.forEach(searchString => {
    filteredVideos = data.filter((video) => {
      return (
        video.odkaz.toLowerCase().includes(searchString) ||
        video.nazev.toLowerCase().includes(searchString) ||
        video.vyucujici.toLowerCase().includes(searchString) ||
        video.predmet.toLowerCase().includes(searchString) ||
        video.keywords.toLowerCase().includes(searchString) ||
        video.typ.toLowerCase().includes(searchString) ||
        video.kod.toLowerCase().includes(searchString)
      );
    });
  });
  
  showVideos(filteredVideos);
  
  autocomplete.innerHTML = '';
  const filteredStrings = allStrings.filter((s) => {
    // remove accents
    return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(searchString.normalize("NFD").replace(/[\u0300-\u036f]/g, ""))
  });
  
  var numberSuggestions = 5;
  filteredStrings.slice(0, numberSuggestions).forEach(function(suggested) {
    if (!(labels.includes(suggested))) {
      const div = document.createElement('div');
      div.classList.add('navrh');
      div.innerHTML = suggested;
      autocomplete.appendChild(div);
    };
  });
  
  const suggestions = document.getElementsByClassName('navrh');
  
  for (let i = 0; i < suggestions.length; i++) {
    autocomplete.id = 'full';
    suggestions[i].addEventListener('click', addLabel);
  };
  
  if (searchString  === '') {
    autocomplete.innerHTML = '';
    autocomplete.id = 'empty';
    searchResults.innerHTML = '';
  };
});


const showVideos = (data) => {
  const htmlString = data
    .map((video) => {
      const keywordsSeparated = video.keywords.replaceAll(",",", ");
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
    searchResults.innerHTML = htmlString;
    showResultsCount(data.length);
};


function showResultsCount (resultsCount) {
    $("#resultsCount").empty();
    $("#resultsCount").append("<p>vypudlováno " + resultsCount + " videí</p>");
};


function addLabel () {
  const suggestion = this.innerHTML;
  searchStrings.push(suggestion);
  const div = document.createElement("div");
  div.classList.add("label");
  div.innerHTML = `
  <p>${suggestion}</p>
  <p class="closing">x</p>
  `;
  div.getElementsByClassName("closing")[0].addEventListener("click", deleteLabel);
  const stitky = document.getElementById("labels");
  stitky.appendChild(div);
  autocomplete.innerHTML = "";
  autocomplete.id = "empty";
  document.getElementById("searchBar").value = "";
  labels.push(suggestion);
  labels.forEach((label) => {
    filteredVideos = filteredVideos.filter(function(video) {
      return (
        video.odkaz.toLowerCase().includes(label) ||
        video.nazev.toLowerCase().includes(label) ||
        video.vyucujici.toLowerCase().includes(label) ||
        video.predmet.toLowerCase().includes(label) ||
        video.tyden.toString().toLowerCase().includes(label) ||
        video.keywords.toLowerCase().includes(label) ||
        video.typ.toLowerCase().includes(label) ||
        video.kod.toLowerCase().includes(label)
       )
    })
  });
  showVideos(filteredVideos);
};


function addLabelSubject (suggestion) {
  searchStrings.push(suggestion);
  const div = document.createElement("div");
  div.classList.add("label");
  div.innerHTML = `
  <p>${suggestion}</p>
  <p class='closing'>x</p>
  `;
  div.getElementsByClassName("closing")[0].addEventListener("click", deleteLabel);
  const stitky = document.getElementById("labels");
  stitky.appendChild(div);
  autocomplete.innerHTML = "";
  autocomplete.id = "empty";
  document.getElementById("searchBar").value = "";
  labels.push(suggestion);
  console.log("suggestion " + labels);
  filteredVideos = data.filter(function(video) {
    return (
      video.predmet == suggestion
     );
  });
  showVideos(filteredVideos);
};

function deleteLabel () {
  suggestion = $(this).parent().children()[0].innerHTML;
  console.log(suggestion);
  labels = labels.filter(function(value, index, arr){ 
    return value != suggestion;
  });
  
  $(this).parent().remove();

  if (labels.length == 0) {
    $(".videoResult").remove();
    $("#resultsCount").empty();
  } else {
    // update list of videos shown
    labels.forEach((label) => {
      filteredVideos = data.filter(function(video) {
        return (
          video.odkaz.toLowerCase().includes(label) ||
          video.nazev.toLowerCase().includes(label) ||
          video.vyucujici.toLowerCase().includes(label) ||
          video.predmet.toLowerCase().includes(label) ||
          video.tyden.toString().toLowerCase().includes(label) ||
          video.keywords.toLowerCase().includes(label) ||
          video.typ.toLowerCase().includes(label) ||
          video.kod.toLowerCase().includes(label)
         )
      })
    });
    showVideos(filteredVideos);
  };
};


function clearLabels() {
    $(".label").each(function () {
        $(this).remove();
    });
    labels = [];
    $("#resultsCount").empty();
};


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


