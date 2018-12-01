const URL = "http://localhost:8088"

const API = {

  getSingleItem(id, extension) {
    return fetch(`${URL}/${extension}/${id}`).then(data => data.json())
  },

  getAll(extension) {
    return fetch(`${URL}/${extension}`).then(data => data.json())
  },

  deleteSingleItem(id, extension) {
    return fetch(`${URL}/${extension}/${id}`, {
      method: "DELETE"
    })
      .then(e => e.json())
      .then(() => fetch(`${URL}/${extension}`))
      .then(e => e.json())
  },

  postItem(obj, extension) {
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