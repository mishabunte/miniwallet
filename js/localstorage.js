$(document).ready(function() {

  $('.js-localstorage').each(function() {
    let el = $(this);
    const value = localStorage.getItem(el.attr('id'));
    if (value) {
      el.val(value);
      setTimeout(() => {
        //el.trigger('input');
      }, 250);
    }
    el.on('input', () => {
      localStorage.setItem(el.attr('id'), el.val());
    });
    el.on('change2', () => {
      localStorage.setItem(el.attr('id'), el.val());
    });
  });

});
