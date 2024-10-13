class RequestsHandler {
    static async get(url, headers, params = null, proxies = null) {
        const response = await fetch(url + this.formatParams(params), {
            method: 'GET',
            headers: headers
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response;
    }

    static async post(url, headers, data = null, proxies = null) {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: data instanceof URLSearchParams ? data : JSON.stringify(data)
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response;
    }

    static async delete(url, headers, proxies = null) {
        const response = await fetch(url, {
            method: 'DELETE',
            headers: headers
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response;
    }

    static formatParams(params) {
        if (!params) return '';
        return '?' + Object.entries(params)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
            .join('&');
    }
}

export { RequestsHandler };