
var forgotPasswordModal = document.getElementById('forgot-password-modal');
var createAccountModal = document.getElementById('create-account-modal');

var forgotPasswordButton = document.getElementById('forgot-password');
var createAccountButton = document.getElementById('create-account');

forgotPasswordButton.addEventListener('click', function(event) {
  event.preventDefault(); 
  forgotPasswordModal.style.display = 'block'; 
});

createAccountButton.addEventListener('click', function(event) {
  event.preventDefault(); 
  createAccountModal.style.display = 'block'; 
});


var closeButtons = document.querySelectorAll('.close');
closeButtons.forEach(function(button) {
  button.addEventListener('click', function() {
    forgotPasswordModal.style.display = 'none'; 
    createAccountModal.style.display = 'none'; 
  });
});


document.addEventListener('click', function(event) {
  if (event.target === forgotPasswordModal || event.target === createAccountModal) {
    forgotPasswordModal.style.display = 'none'; 
    createAccountModal.style.display = 'none'; 
  }
});