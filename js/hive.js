var conceptIds = [];
var prefLabels = [];
var altLabels = [];

var currentConceptId = '';

function loadVocabularyData() {
    if ($("#vocab_data").length) {
        $.getJSON("http://localhost:8080/hive-rest/rest/schemes/names", function (data) {
            var vocabNames = [];
            var i = 0;

            $.each(data.schemes, function () {
                vocabNames.push(data.schemes[i].name.toUpperCase());

                i++;
            });

            var html = '<table class="table table-striped"> <thead> <tr> <td>Vocabulary</td> <td>Concepts</td> <td>Relationships</td> <td>Last Updated</td> </tr> </thead> <tbody>';
            i = 0;

            $.each(vocabNames, function (key, val) {
                var vocabularyName = val;
                var numberOfConcepts = getVocabularyInfo('numberOfConcepts', vocabularyName);
                var numberOfRelations = getVocabularyInfo('numberOfRelations', vocabularyName);
                var lastDate = getVocabularyInfo('lastDate', vocabularyName);

                var lastUpdated = lastDate.split(" ");
                var lastUpdatedStr = lastUpdated[1] + ', ' + lastUpdated[2] + ' ' + lastUpdated[5];

                html += '<tr> <td><a href="#">' + vocabularyName + '</a></td> <td>' + numberOfConcepts + '</td> <td>' + numberOfRelations + '</td> <td>' + lastUpdatedStr + '</td> </tr>';
            });

            html += '</tbody> </table>';

            $("#vocab_data").append(html);
        });
    }
}

function getVocabularyInfo(infoType, vocabulary) {
    var result = '';
    $.ajax({
        url: "http://localhost:8080/hive-rest/rest/schemes/" + vocabulary + "/" + infoType,
        dataType: "text",
        async: false,
        success: function (data) {
            result = data;
        }
    });

    return result;
}

function indexingProcessing() {
    $("#startIndexing").prop('value', 'Processing...').prop('disabled', 'disabled');

    var indexingURL = $("#indexing_url").val();

    $.getJSON("http://localhost:8080/hive-rest/rest/schemes/multi/concepts/tags/url?url=" + indexingURL + "&vocs=uat", function (data) {
        $("#indexing_input").addClass("hidden");

        var i = 0;

        $.each(data.concepts, function () {
            conceptIds.push(data.concepts[i].uri.split("#")[1]);
            prefLabels.push(data.concepts[i].prefLabel);

            i++;
        });

        $("#indexing_results").removeClass("invisible");

        var html = "";
        i = 0;

        $.each(prefLabels, function (key, val) {
            html += "<h4 id=\"" + conceptIds[i] + "\" class=\"concept-name\">" + val + "</h4>";

            i++;
        });

        html += "<div class='clearfix'></div><br/><p>Click on a concept to view its information.</p><br/>";

        $("#extracted_concepts").append(html);

        $(".concept-name").click(function () {
            loadConceptInfo($(this).attr('id'));
        });
    });
}

function loadConceptInfo(conceptId) {
    //console.log(conceptId);

    var prefLabel = getPrefLabel(conceptId);

    var altLabelsStr = 'This concept does not have alternative labels.';
    var broadersStr = 'This concept does not have broader terms.';
    var narrowersStr = 'This concept does not have narrower terms.';
    var relatedsStr = 'This concept does not have related concepts.';
    var scopeNotesStr = 'This concept does not have scope notes.';

    var uriStr = getSchemaURI('uat') + "#" + conceptId;

    var broaders = getConcepts('broader', conceptId);
    if ($(broaders).find('prefLabel').length) {
        broadersStr = '';
        $.each($(broaders).find('prefLabel'), function () {
            var broaderConceptId = $(this).next().children('localPart').text();
            broadersStr += "<span id=\"" + broaderConceptId + "\" class=\"concept-name\">" + $(this).text() + "</span>; ";
        });

        broadersStr = broadersStr.slice(0, -3);
    }

    var narrowers = getConcepts('narrower', conceptId);
    if ($(narrowers).find('prefLabel').length) {
        narrowersStr = '';
        $.each($(narrowers).find('prefLabel'), function () {
            var narrowerConceptId = $(this).next().children('localPart').text();
            narrowersStr += "<span id=\"" + narrowerConceptId + "\" class=\"concept-name\">" + $(this).text() + "</span>; ";
        });

        narrowersStr = narrowersStr.slice(0, -3);
    }

    var relateds = getConcepts('related', conceptId);
    if ($(relateds).find('prefLabel').length) {
        relatedsStr = '';
        $.each($(relateds).find('prefLabel'), function () {
            var relatedConceptId = $(this).next().children('localPart').text();
            relatedsStr += "<span id=\"" + relatedConceptId + "\" class=\"concept-name\">" + $(this).text() + "</span>; ";
        });

        relatedsStr = relatedsStr.slice(0, -3);
    }

    var html = "";

    html += '<table class="table-bordered table-striped col-lg-12"><tr> <td class="yellow">Preferred Label</td> <td class="row_prefLabel">' + prefLabel + '</td> </tr> <tr> <td class="yellow">URI</td> <td class="row_URI">' + uriStr + '</td> </tr> <tr> <td class="yellow">Alternative Label</td> <td class="row_altLabel">' + altLabelsStr + '</td> </tr> <tr> <td class="yellow">Broader Concepts</td> <td class="row_broader">' + broadersStr + '</td> </tr> <tr> <td class="yellow">Narrower Concepts</td> <td class="row_narrower">' + narrowersStr + '</td> </tr> <tr> <td class="yellow">Related Concepts</td> <td class="row_relateds">' + relatedsStr + '</td> </tr> <tr> <td class="yellow">Scope Notes</td> <td class="row_scopeNotes">' + scopeNotesStr + '</td> </tr> </table>';

    $("#concept_info").empty().append(html);

    $("#skos_display").addClass("invisible");

    $(".concept-name").click(function () {
        loadConceptInfo($(this).attr('id'));
    });

    setCurrentConceptId(conceptId);
}

function getPrefLabel(conceptId) {
    var result = '';
    $.ajax({
        url: "http://localhost:8080/hive-rest/rest/schemes/uat/concepts/" + conceptId + "/prefLabel",
        async: false,
        success: function (data) {
            result = data;
        }
    });

    return result;
}

function getSchemaURI(schemaName) {
    var result = '';
    $.ajax({
        url: "http://localhost:8080/hive-rest/rest/schemes/" + schemaName + "/schemaURI",
        async: false,
        success: function (data) {
            result = data;
        }
    });

    return result;
}

function getConcepts(conceptType, conceptId) {
    var result = "";
    var url = "http://localhost:8080/hive-rest/rest/schemes/uat/concepts/" + conceptId + "/" + conceptType + "s";

    $.ajax({
        url: url,
        dataType: "xml",
        async: false,
        success: function (data) {
            result = data;
        }
    });

    return result;
}

function getSKOS(conceptId) {
    var result = '';
    $.ajax({
        url: "http://localhost:8080/hive-rest/rest/schemes/uat/concepts/" + conceptId + "/SKOSFormat",
        dataType: "text",
        async: false,
        success: function (data) {
            result = data;
        }
    });

    return result;
}

function setCurrentConceptId(concepId) {
    currentConceptId = concepId;
}

$(function () {
    loadVocabularyData();

    $("#indexing_restart").click(function () {
        window.location = 'indexing.html';
    });

    $("#view_in_skos").click(function () {
        if (currentConceptId.length) {
            var skosXML = getSKOS(currentConceptId);

            $("#skos_display").removeClass("invisible");

            $("#skos_text").html(skosXML);
        }
        else {
            alert('Please select a concept to view SKOS.');
        }
    });

    console.clear();
});

