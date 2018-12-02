const URL = "http://localhost:8088"

const API = {

  getSingleItem(extension, id) {
    return fetch(`${URL}/${extension}/${id}`).then(data => data.json())
  },

  getAll(extension) {
    return fetch(`${URL}/${extension}`).then(data => data.json())
  },

  deleteItem(extension, id) {
    return fetch(`${URL}/${extension}/${id}`, {
      method: "DELETE"
    })
      .then(e => e.json())
      .then(() => fetch(`${URL}/${extension}`))
      .then(e => e.json())
  },

  postItem(extension, obj) {
    return fetch(`${URL}/${extension}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(obj)
    })
      .then(r => r.json())
  }

}

export default API