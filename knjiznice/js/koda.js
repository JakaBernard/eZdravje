
var baseUrl = 'https://rest.ehrscape.com/rest/v1';
var queryUrl = baseUrl + '/query';

var username = "ois.seminar";
var password = "ois4fri";


/**
 * Prijava v sistem z privzetim uporabnikom za predmet OIS in pridobitev
 * enolične ID številke za dostop do funkcionalnosti
 * @return enolični identifikator seje za dostop do funkcionalnosti
 */
function getSessionId() {
    var response = $.ajax({
        type: "POST",
        url: baseUrl + "/session?username=" + encodeURIComponent(username) +
                "&password=" + encodeURIComponent(password),
        async: false
    });
    return response.responseJSON.sessionId;
}

//kopija iz vaj od tukaj
function kreirajEHRzaBolnika() {
	sessionId = getSessionId();

	var ime = $("#kreirajIme").val();
	var priimek = $("#kreirajPriimek").val();
	var datumRojstva = $("#kreirajDatumRojstva").val();

	if (!ime || !priimek || !datumRojstva || ime.trim().length == 0 ||
      priimek.trim().length == 0 || datumRojstva.trim().length == 0) {
		$("#kreirajSporocilo").html("<span class='obvestilo label " +
      "label-warning fade-in'>Prosim vnesite zahtevane podatke!</span>");
	} else {
		$.ajaxSetup({
		    headers: {"Ehr-Session": sessionId}
		});
		$.ajax({
		    url: baseUrl + "/ehr",
		    type: 'POST',
		    success: function (data) {
		        var ehrId = data.ehrId;
		        var partyData = {
		            firstNames: ime,
		            lastNames: priimek,
		            dateOfBirth: datumRojstva,
		            partyAdditionalInfo: [{key: "ehrId", value: ehrId}]
		        };
		        $.ajax({
		            url: baseUrl + "/demographics/party",
		            type: 'POST',
		            contentType: 'application/json',
		            data: JSON.stringify(partyData),
		            success: function (party) {
		                if (party.action == 'CREATE') {
		                    $("#kreirajSporocilo").html("<span class='obvestilo " +
                          "label label-success fade-in'>Uspešno kreiran EHR '" +
                          ehrId + "'.</span>");
		                    $("#preberiEHRid").val(ehrId);
		                }
		            },
		            error: function(err) {
		            	$("#kreirajSporocilo").html("<span class='obvestilo label " +
                    "label-danger fade-in'>Napaka '" +
                    JSON.parse(err.responseText).userMessage + "'!");
		            }
		        });
		    }
		});
	}
}


/**
 * Za podan EHR ID preberi demografske podrobnosti pacienta in izpiši sporočilo
 * s pridobljenimi podatki (ime, priimek in datum rojstva).
 */
function preberiEHRodBolnika() {
	sessionId = getSessionId();

	var ehrId = $("#preberiEHRid").val();

	if (!ehrId || ehrId.trim().length == 0) {
		$("#preberiSporocilo").html("<span class='obvestilo label label-warning " +
      "fade-in'>Prosim vnesite zahtevan podatek!");
	} else {
		$.ajax({
			url: baseUrl + "/demographics/ehr/" + ehrId + "/party",
			type: 'GET',
			headers: {"Ehr-Session": sessionId},
	    	success: function (data) {
				var party = data.party;
				$("#preberiSporocilo").html("<span class='obvestilo label " +
          "label-success fade-in'>Bolnik '" + party.firstNames + " " +
          party.lastNames + "', ki se je rodil '" + party.dateOfBirth +
          "'.</span>");
			},
			error: function(err) {
				$("#preberiSporocilo").html("<span class='obvestilo label " +
          "label-danger fade-in'>Napaka '" +
          JSON.parse(err.responseText).userMessage + "'!");
			}
		});
	}
}


/**
 * Za dodajanje vitalnih znakov pacienta je pripravljena kompozicija, ki
 * vključuje množico meritev vitalnih znakov (EHR ID, datum in ura,
 * telesna višina, telesna teža, sistolični in diastolični krvni tlak,
 * nasičenost krvi s kisikom in merilec).
 */
function dodajMeritveVitalnihZnakov() {
	sessionId = getSessionId();

	var ehrId = $("#dodajVitalnoEHR").val();
	var datumInUra = $("#dodajVitalnoDatumInUra").val();
	var telesnaVisina = $("#dodajVitalnoTelesnaVisina").val();
	var telesnaTeza = $("#dodajVitalnoTelesnaTeza").val();
	var telesnaTemperatura = $("#dodajVitalnoTelesnaTemperatura").val();
	var sistolicniKrvniTlak = $("#dodajVitalnoKrvniTlakSistolicni").val();
	var diastolicniKrvniTlak = $("#dodajVitalnoKrvniTlakDiastolicni").val();
	var nasicenostKrviSKisikom = $("#dodajVitalnoNasicenostKrviSKisikom").val();
	var merilec = $("#dodajVitalnoMerilec").val();

	if (!ehrId || ehrId.trim().length == 0) {
		$("#dodajMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo " +
      "label label-warning fade-in'>Prosim vnesite zahtevane podatke!</span>");
	} else {
		$.ajaxSetup({
		    headers: {"Ehr-Session": sessionId}
		});
		var podatki = {
			// Struktura predloge je na voljo na naslednjem spletnem naslovu:
      // https://rest.ehrscape.com/rest/v1/template/Vital%20Signs/example
		    "ctx/language": "en",
		    "ctx/territory": "SI",
		    "ctx/time": datumInUra,
		    "vital_signs/height_length/any_event/body_height_length": telesnaVisina,
		    "vital_signs/body_weight/any_event/body_weight": telesnaTeza,
		   	"vital_signs/body_temperature/any_event/temperature|magnitude": telesnaTemperatura,
		    "vital_signs/body_temperature/any_event/temperature|unit": "°C",
		    "vital_signs/blood_pressure/any_event/systolic": sistolicniKrvniTlak,
		    "vital_signs/blood_pressure/any_event/diastolic": diastolicniKrvniTlak,
		    "vital_signs/indirect_oximetry:0/spo2|numerator": nasicenostKrviSKisikom
		};
		var parametriZahteve = {
		    ehrId: ehrId,
		    templateId: 'Vital Signs',
		    format: 'FLAT',
		    committer: merilec
		};
		$.ajax({
		    url: baseUrl + "/composition?" + $.param(parametriZahteve),
		    type: 'POST',
		    contentType: 'application/json',
		    data: JSON.stringify(podatki),
		    success: function (res) {
		        $("#dodajMeritveVitalnihZnakovSporocilo").html(
              "<span class='obvestilo label label-success fade-in'>" +
              res.meta.href + ".</span>");
		    },
		    error: function(err) {
		    	$("#dodajMeritveVitalnihZnakovSporocilo").html(
            "<span class='obvestilo label label-danger fade-in'>Napaka '" +
            JSON.parse(err.responseText).userMessage + "'!");
		    }
		});
	}
}

var tlakGraf = [];
var BMIGraf = [];
var temperaturaGraf = [];
var kisikGraf = [];
/**
 * Pridobivanje vseh zgodovinskih podatkov meritev izbranih vitalnih znakov
 * (telesna temperatura, filtriranje telesne temperature in telesna teža).
 * Filtriranje telesne temperature je izvedena z AQL poizvedbo, ki se uporablja
 * za napredno iskanje po zdravstvenih podatkih.
 */
function preberiMeritveVitalnihZnakov() {//to se klice, da dobis temperaturo ipd.!!!
	sessionId = getSessionId();

	var ehrId = $("#meritveVitalnihZnakovEHRid").val();
	var tip = $("#preberiTipZaVitalneZnake").val();

	if (!ehrId || ehrId.trim().length == 0 || !tip || tip.trim().length == 0) {
		$("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo " +
      "label label-warning fade-in'>Prosim vnesite zahtevan podatek!");
	} else {
		$.ajax({
			url: baseUrl + "/demographics/ehr/" + ehrId + "/party",
	    	type: 'GET',
	    	headers: {"Ehr-Session": sessionId},
	    	success: function (data) {
				var party = data.party;
				$("#rezultatMeritveVitalnihZnakov").html("<br/><span>Pridobivanje " +
        		"podatkov za <b>'" + tip + "'</b> bolnika <b>'" + party.firstNames +
        		" " + party.lastNames + "'</b>.</span><br/><br/>");
				if (tip == "telesna temperatura") {
					$.ajax({
  					    url: baseUrl + "/view/" + ehrId + "/" + "body_temperature",
					    type: 'GET',
					    headers: {"Ehr-Session": sessionId},
					    success: function (res) {
					    	if (res.length > 0) {
					    		temperaturaGraf = [];
						    	var results = "<table class='table table-striped " +
                    			"table-hover'><tr><th>Datum in ura</th>" +
                				 "<th class='text-right'>Telesna temperatura</th></tr>";
						        for (var i in res) {
						            results += "<tr><td>" + res[i].time +
                        			 "</td><td class='text-right'>" + res[i].temperature +
                        			 " " + res[i].unit + "</td>";
                        			temperaturaGraf.push(res[i].temperature);
						        }
						        results += "</table>";
						        $("#rezultatMeritveVitalnihZnakov").append(results);
						        prikaziGraf(temperaturaGraf, 1);//tukej nej bi se pol izvedlo, da se prikaze graf al neki
					    	} else {
					    		$("#preberiMeritveVitalnihZnakovSporocilo").html(
                    			"<span class='obvestilo label label-warning fade-in'>" +
                				 "Ni podatkov!</span>");
					    	}
					    },
					    error: function() {
					    	$("#preberiMeritveVitalnihZnakovSporocilo").html(
                			 "<span class='obvestilo label label-danger fade-in'>Napaka '" +
                			 JSON.parse(err.responseText).userMessage + "'!");
					    }
					});
				} else if (tip == "telesna teža") {
					$.ajax({
					    url: baseUrl + "/view/" + ehrId + "/" + "weight",
					    type: 'GET',
					    headers: {"Ehr-Session": sessionId},
					    success: function (res) {
					    	if (res.length > 0) {
						    	var results = "<table class='table table-striped " +
                    			"table-hover'><tr><th>Datum in ura</th>" +
                    			"<th class='text-right'>Telesna teža</th></tr>";
						        for (var i in res) {
						            results += "<tr><td>" + res[i].time +
                        		"</td><td class='text-right'>" + res[i].weight + " " 	+
                          res[i].unit + "</td>";
						        }
						        results += "</table>";
						        $("#rezultatMeritveVitalnihZnakov").append(results);
					    	} else {
					    		$("#preberiMeritveVitalnihZnakovSporocilo").html(
                    			"<span class='obvestilo label label-warning fade-in'>" +
                    			"Ni podatkov!</span>");
					    	}
					    },
					    error: function() {
					    	$("#preberiMeritveVitalnihZnakovSporocilo").html(
                			"<span class='obvestilo label label-danger fade-in'>Napaka '" +
                  JSON.parse(err.responseText).userMessage + "'!");
					    }
					});
				}
	    	},
	    	error: function(err) {
	    		$("#preberiMeritveVitalnihZnakovSporocilo").html(
            	"<span class='obvestilo label label-danger fade-in'>Napaka '" +
            	JSON.parse(err.responseText).userMessage + "'!");
	    	}
		});
	}
}


$(document).ready(function() {

  /**
   * Napolni testne vrednosti (ime, priimek in datum rojstva) pri kreiranju
   * EHR zapisa za novega bolnika, ko uporabnik izbere vrednost iz
   * padajočega menuja (npr. Pujsa Pepa).
   */
  $('#preberiPredlogoBolnika').change(function() {
    $("#kreirajSporocilo").html("");
    var podatki = $(this).val().split(",");
    $("#kreirajIme").val(podatki[0]);
    $("#kreirajPriimek").val(podatki[1]);
    $("#kreirajDatumRojstva").val(podatki[2]);
  });

  /**
   * Napolni testni EHR ID pri prebiranju EHR zapisa obstoječega bolnika,
   * ko uporabnik izbere vrednost iz padajočega menuja
   * (npr. Dejan Lavbič, Pujsa Pepa, Ata Smrk)
   */
	$('#preberiObstojeciEHR').change(function() {
		$("#preberiSporocilo").html("");
		$("#preberiEHRid").val($(this).val());
	});

  /**
   * Napolni testne vrednosti (EHR ID, datum in ura, telesna višina,
   * telesna teža, telesna temperatura, sistolični in diastolični krvni tlak,
   * nasičenost krvi s kisikom in merilec) pri vnosu meritve vitalnih znakov
   * bolnika, ko uporabnik izbere vrednosti iz padajočega menuja (npr. Ata Smrk)
   */
	$('#preberiObstojeciVitalniZnak').change(function() {
		$("#dodajMeritveVitalnihZnakovSporocilo").html("");
		var podatki = $(this).val().split("|");
		$("#dodajVitalnoEHR").val(podatki[0]);
		$("#dodajVitalnoDatumInUra").val(podatki[1]);
		$("#dodajVitalnoTelesnaVisina").val(podatki[2]);
		$("#dodajVitalnoTelesnaTeza").val(podatki[3]);
		$("#dodajVitalnoTelesnaTemperatura").val(podatki[4]);
		$("#dodajVitalnoKrvniTlakSistolicni").val(podatki[5]);
		$("#dodajVitalnoKrvniTlakDiastolicni").val(podatki[6]);
		$("#dodajVitalnoNasicenostKrviSKisikom").val(podatki[7]);
		$("#dodajVitalnoMerilec").val(podatki[8]);
	});

  /**
   * Napolni testni EHR ID pri pregledu meritev vitalnih znakov obstoječega
   * bolnika, ko uporabnik izbere vrednost iz padajočega menuja
   * (npr. Ata Smrk, Pujsa Pepa)
   */
	$('#preberiEhrIdZaVitalneZnake').change(function() {
		$("#preberiMeritveVitalnihZnakovSporocilo").html("");
		$("#rezultatMeritveVitalnihZnakov").html("");
		$("#meritveVitalnihZnakovEHRid").val($(this).val());
	});

});
//do tukaj


/**
 * Generator podatkov za novega pacienta, ki bo uporabljal aplikacijo. Pri
 * generiranju podatkov je potrebno najprej kreirati novega pacienta z
 * določenimi osebnimi podatki (ime, priimek in datum rojstva) ter za njega
 * shraniti nekaj podatkov o vitalnih znakih.
 * @param stPacienta zaporedna številka pacienta (1, 2 ali 3)
 * @return ehrId generiranega pacienta
 */
function generiranjeTrehPrimerkov() {
	$("#kreirajSporocilo").html("");
	generirajPodatke(1);
	//console.log(1 + " === " + riptest1);
	generirajPodatke(2);
	//console.log(2 + " === " + riptest2);
	generirajPodatke(3);
	//console.log(3 + " === " + riptest3);
	//generirajRandomVnose(riptest1);
	//generirajRandomVnose(riptest2);
	//generirajRandomVnose(riptest3);
}

function generirajPodatke(stPacienta) {
 ehrId = "";
	switch(stPacienta){
		case 1 :
			ehrId += kreirajCustom("Jožef", "Kralj", "1969-04-20T04:20");
			break;
		case 2 :
			ehrId += kreirajCustom("An", "Žemur", "1996-05-30T15:33");
			break;
		case 3 :
			ehrId += kreirajCustom("Horest", "Hump", "1980-06-06T13:13");
			break;
	}
	
  // TODO: Potrebno implementirati

  return ehrId;
}

function kreirajCustom(imeIn, priimekIn, datumRojstvaIn) {
	sessionId = getSessionId();

	var ime = imeIn;
	var priimek = priimekIn;
	var datumRojstva = datumRojstvaIn;
	
	if (!ime || !priimek || !datumRojstva || ime.trim().length == 0 ||
      priimek.trim().length == 0 || datumRojstva.trim().length == 0) {
		$("#kreirajSporocilo").html("<span class='obvestilo label " +
      "label-warning fade-in'>Prosim vnesite zahtevane podatke!</span>");
	} else {
		$.ajaxSetup({
		    headers: {"Ehr-Session": sessionId}
		});
		$.ajax({
		    url: baseUrl + "/ehr",
		    type: 'POST',
		    success: function (data) {
		        var ehrId = data.ehrId;
		        var partyData = {
		            firstNames: ime,
		            lastNames: priimek,
		            dateOfBirth: datumRojstva,
		            partyAdditionalInfo: [{key: "ehrId", value: ehrId}]
		        };
		        $.ajax({
		            url: baseUrl + "/demographics/party",
		            type: 'POST',
		            contentType: 'application/json',
		            data: JSON.stringify(partyData),
		            success: function (party) {
		                if (party.action == 'CREATE') {
		                	var ehrVnos = "<div class = 'row'><span class='obvestilo " +
                          "label label-success fade-in'>Uspešno kreiran EHR '" +
                          ehrId + "'.</span></div>";
		                    $("#kreirajSporocilo").html($("#kreirajSporocilo").html() + ehrVnos);
		                    //console.log(ehrVnos);
		                    //console.log(ehrId);
		                    generirajRandomVnose(ehrId);
		                    outPrint = ehrId;
		                }
		            },
		            error: function(err) {
		            	$("#kreirajSporocilo").html("<span class='obvestilo label " +
                    "label-danger fade-in'>Napaka '" +
                    JSON.parse(err.responseText).userMessage + "'!");
		            }
		        });
		    }
		});
		
	}
	//console.log("outPrint:  " + outPrint);
	//return outPrint;
	//callback(outPrint);
}

function generirajRandomVnose(ehrIn) {
	for(var i = 0; i <= 20; i++){
		sessionId = getSessionId();

		var ehrId = ehrIn;
		var leto = Math.floor(Math.random()*20 + 1996);
		var mesec = Math.floor(Math.random()*12 + 1);
		var max;
		if(mesec == 2 && (leto % 4 == 0)) {
			max = 29;
		} else if(mesec == 2) {
			max = 28;
		} else if(mesec == 1 || mesec == 3 || mesec == 5 || mesec == 7 || mesec == 8 || mesec == 10 || mesec == 12){
			max = 31;
		} else {
			max = 30;
		}
		var dan = Math.floor(Math.random()*max + 1);
		var ura	= Math.floor(Math.random()*23 + 1);
		var minute = Math.floor(Math.random()*60);
		var Mzero = "";
		if (mesec < 10) Mzero = "0";
		var Dzero = "";
		if (dan < 10) Dzero = "0";
		var hzero = "";
		if (ura < 10) hzero = "0";
		var mzero = "";
		if (minute < 10) mzero = "0";
		
		var datumInUra = leto + "-" + Mzero + mesec + "-" + Dzero + dan + "T" + hzero + ura + ":" + mzero + minute + "Z";
		var telesnaVisina = Math.floor(Math.random()*100 + 120);
		var telesnaTeza = Math.floor(Math.random()*70 + 45);
		var telesnaTemperatura = Math.floor(Math.random()*30 + 15);
		var sistolicniKrvniTlak = Math.floor(Math.random()*120 + 70);
		var diastolicniKrvniTlak = Math.floor(Math.random()*60 + 40);
		var nasicenostKrviSKisikom = Math.floor(Math.random()*15 + 85);
		var merilec = "Mirko Naključnik";

		if (!ehrId || ehrId.trim().length == 0) {/*
			$("#dodajMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo " +
    	  "label label-warning fade-in'>Prosim vnesite zahtevane podatke!</span>");*/
		} else {
			$.ajaxSetup({
			    headers: {"Ehr-Session": sessionId}
			});
			var podatki = {
				// Struktura predloge je na voljo na naslednjem spletnem naslovu:
    	  // https://rest.ehrscape.com/rest/v1/template/Vital%20Signs/example
			    "ctx/language": "en",
			    "ctx/territory": "SI",
			    "ctx/time": datumInUra,
			    "vital_signs/height_length/any_event/body_height_length": telesnaVisina,
			    "vital_signs/body_weight/any_event/body_weight": telesnaTeza,
			   	"vital_signs/body_temperature/any_event/temperature|magnitude": telesnaTemperatura,
			    "vital_signs/body_temperature/any_event/temperature|unit": "°C",
			    "vital_signs/blood_pressure/any_event/systolic": sistolicniKrvniTlak,
			    "vital_signs/blood_pressure/any_event/diastolic": diastolicniKrvniTlak,
			    "vital_signs/indirect_oximetry:0/spo2|numerator": nasicenostKrviSKisikom
			};
			var parametriZahteve = {
			    ehrId: ehrId,
			    templateId: 'Vital Signs',
			    format: 'FLAT',
			    committer: merilec
			};
			$.ajax({
			    url: baseUrl + "/composition?" + $.param(parametriZahteve),
		    	type: 'POST',
			    contentType: 'application/json',
			    data: JSON.stringify(podatki),
			    success: function (res) {
		    	    /*$("#dodajMeritveVitalnihZnakovSporocilo").html(
        	      "<span class='obvestilo label label-success fade-in'>" +
    	          res.meta.href + ".</span>");*/
			    },
		    	error: function(err) {
			    	/*$("#dodajMeritveVitalnihZnakovSporocilo").html(
    	        "<span class='obvestilo label label-danger fade-in'>Napaka '" +
	            JSON.parse(err.responseText).userMessage + "'!");*/
			    }
			});
		}
	}

}

function prikaziGraf(tabelaPodatkov, tip) {//tip 1 = temperatura, 2 = BMI, 3 = tlak
	if(tabelaPodatkov.length > 0){
		var procenti = [];
		var temperaturaZaPrikaz = [];
		var salesData = [];
		var grupePodatkov = [];
		$('#legenda').html("");
		$('#DonutGraf').html("");
		if(tip == 1){//35.8 - 37.2  normalno za zdravega cloveka    42,8 °C, spodnja pa 27 °C   <-- smrtni meji
			
			var c1 = 0;//-
			var c2 = 0;
			var c3 = 0;//+
			var je1 = false;//-
			var je2 = false;
			var je3 = false;//+
			for(var i in tabelaPodatkov){
				if(tabelaPodatkov[i] < 35.8) {
					if(!je1){
						je1 = !je1;
					}
					c1++;
				} else if (tabelaPodatkov[i] > 37.2) {
					if(!je3){
						je3 = !je3;
					}
					c3++;
				} else {
					if(!je2){
						je2 = !je2;
					}
					c2++;
				}
			}
			grupePodatkov.push("Prenizka Temperatura");
			grupePodatkov.push("Normalna Temperatura");
			grupePodatkov.push("Povišana Temperatura");
			var c4 = c1+c2+c3;
			procenti.push(c1*100/c4);
			console.log(c1*100/c4);
			procenti.push(c2*100/c4);
			console.log(c2*100/c4);
			procenti.push(c3*100/c4);
			console.log(c3*100/c4);
		} else if(tip == 2) {
			
			
		} else if (tip == 3) {
			
			
		}
		
		for(i in procenti) {
			if(procenti[i] > 0) {
				if(procenti[i] == 100.00){
					procenti[i] = 99.0;
				}
				var barva = getRandomColor();
				var dataSales = {color: barva, value: procenti[i]};
				salesData.push(dataSales);
				var podatkiTemp = {color: barva, value: i};
				temperaturaZaPrikaz.push(podatkiTemp);
			}
		}
		
		var svg = d3.select("#DonutGraf").append("svg").attr("width",700).attr("height",300);//change ID
		svg.append("g").attr("id", "DataDonut");
		Donut3D.draw("DataDonut", nakljucniPodatki(), 150, 150, 130, 100, 30, 0.4);
		var dodano = "";
		
		
		for(i in temperaturaZaPrikaz) {
			dodano += "<tr><td style='color:white; background-color:"+ temperaturaZaPrikaz[i].color 
			+ "'>" + grupePodatkov[temperaturaZaPrikaz[i].value] +
            "</td>";
		}
		$('#legenda').html(dodano);
		
		function nakljucniPodatki(){
		return salesData.map(function(d){ 
			return {value:d.value, color:d.color};});
		}
	}
}

function getRandomColor() {//google is key
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

// TODO: Tukaj implementirate funkcionalnost, ki jo podpira vaša aplikacija
