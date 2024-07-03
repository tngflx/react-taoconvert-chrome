import dataStore from "../storages/dataStore";

export function getSecretByContentS() {
    const cookies = document.cookie;
    const cookieArray = cookies.split('; ');
    const { _m_h5_tk, _m_h5_tk_enc }: { _m_h5_tk?: string; _m_h5_tk_enc?: string } = cookieArray.reduce((acc: { _m_h5_tk?: string; _m_h5_tk_enc?: string }, cookie) => {
        const [name, value] = cookie.split('=');
        if (name === '_m_h5_tk') {
            acc._m_h5_tk = value;
        } else if (name === '_m_h5_tk_enc') {
            acc._m_h5_tk_enc = value;
        }
        return acc;
    }, {});

    if (!_m_h5_tk || !_m_h5_tk_enc) {
        throw new Error('Cookie can\'t be extracted client side');
    }
    dataStore.setCookieData({ _m_h5_tk, _m_h5_tk_enc });

}