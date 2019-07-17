$(document).ready(async function() {
  if (await Remarkable.isDeviceRegistered()) {
    console.log('registered');
  }
});

$(document).ready(function() {
  $('.sign-in form input[name=code]').on('input', function() {
    $(this).next('button').attr('disabled', $(this).val().length !== 8);
  });

  $('.sign-in form').submit(async function(evt) {
    evt.preventDefault();

    try {
      let code = $('form input[name=code]').val();
      $(this).parents('.container').removeClass('error');
      $('#status').removeClass('error').text('Authenticating with reMarkable\u2026');
      $('form > *').attr('disabled', 'disabled');
      await Remarkable.registerDevice(code);
      $(this).parents('.container').addClass('hide').next().addClass('show');
      $('.gradient-success').addClass('show');
    } catch(err) {
      $('#status').addClass('error').text(err);
      $(this).parents('.container').addClass('error');
      $('form > *').attr('disabled', false);
    }
  });

  $('.goto').click(function() {
    $(this).addClass('hide');
    $(this).next().removeClass('hide');
  });
});
