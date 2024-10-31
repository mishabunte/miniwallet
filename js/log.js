function log(message, noNewLine) {
  var text = $('#log').text();
  if (text && !noNewLine) {
    text += "\n";
  }
  $('#log').text(text + message);
  $('code').each(function() {
     $(this).text($(this).text()).attr('data-highlighted', '');
  });
  hljs.highlightAll();
}

function logClear() {
  $('#log').text('');
}
