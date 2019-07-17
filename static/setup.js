$(document).ready(async function() {
  if (await Remarkable.isDeviceRegistered()) {
    trackEvent('sign_up', 'already_registered');
  } else {
    trackEvent('sign_up', 'start');
  }
});

$(document).ready(function() {
  $('.sign-in form input[name=code]').on('input', function() {
    $(this).next('button').attr('disabled', $(this).val().length !== 8);
  });

  $('#generate-code').click(function() {
    trackEvent('sign_up', 'generate_code');
  });

  $('.sign-in form').submit(async function(evt) {
    evt.preventDefault();

    try {
      let code = $('form input[name=code]').val();
      $(this).parents('.container').removeClass('error');
      $('#status').removeClass('error').text('Authenticating with reMarkable. This can take a few seconds\u2026');
      $('form > *').attr('disabled', 'disabled');
      trackEvent('sign_up', 'try_code');
      await Remarkable.registerDevice(code);
      $(this).parents('.container').addClass('hide').next().addClass('show');
      $('.gradient-success').addClass('show');
      trackEvent('sign_up', 'success');
    } catch(err) {
      $('#status').addClass('error').text(err);
      $(this).parents('.container').addClass('error');
      $('form > *').attr('disabled', false);
      trackEvent('sign_up', 'try_code_error');
    }
  });

  $('.goto').click(function() {
    $(this).addClass('hide');
    $(this).next().removeClass('hide');
  });
});
