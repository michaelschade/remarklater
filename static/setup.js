$(document).ready(function() {
  $('#setupForm').submit(async function(evt) {
    evt.preventDefault();

    try {
      let code = $('#code').val();
      await Remarkable.registerDevice(code);
      $('#setupForm').hide();
      $('#error').hide();
      $('#success').show();
    } catch(err) {
      $('#error').text(err).show();
    }
  });
});
