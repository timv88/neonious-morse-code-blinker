document.addEventListener("DOMContentLoaded", e => {
    document.getElementById('form').addEventListener('submit', send);
});

const send = e => {
    e.preventDefault();
    const value = document.getElementById('message_input').value;
    const data = { name: value };

    fetch(encodeURI(`/api/transmit/${value}`)).then(response => {
        console.log(response);
    }).catch(error => {
        console.error(error);
    });
}