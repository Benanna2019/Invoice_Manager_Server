//authorization middleware
//jwk for aws cognito authorization
const jwt = require("jsonwebtoken");
const jwkToPem = require("jwk-to-pem");

function authorizeUser(req, resp, next) {
  console.log("authorization hit");
  if (req.body.token == null) {
    console.log("token is undefined");
    return resp.status(401).send();
  }
  //jwk keys go here
  //jwk -> tokenid -> pem -> verification between jwt and pem

  const jwk = {
    keys: [
      {
        alg: "RS256",
        e: "AQAB",
        kid: "1Bf/th1d1QSEO3ZyVviXgx6ZqtvKwbLxa/TdAhTS5mU=",
        kty: "RSA",
        n:
          "jT8b2PtsCFrAcpZkbi5cD-Qo7mj6XZ_zofMzLAMfkqwGTV8BMQC2awDn1uPjyXAZYYKYn6xgqe27HOWRiUzU_DP-4B3mfJkEc_-bi9Ci8-LP4SMShPV4ASr7CSm8OvfFJN6WjIajaL6fYAHJdJDXleg0-zfg4LcX078WXXW3ZkWd4Pex9-M5ja1ahfQvJ_tgveAs-jN8LRrwdNvkHrHRHUGFiNeRKXuLUx3jAyerlnhI48I1YWGdnSrZ3WmiiHIvJBbTETq3CbRDDinKS4uuikL8PpiangyMb_-yedwA5BHMLo8UhpwA1VLOx692sfIwSL3dACogA0XY2dseO_LGmQ",
        use: "sig",
      },
      {
        alg: "RS256",
        e: "QAB",
        kid: "YJOXoxsMiZvXx/k5ah6IM1VftMIffHIpSXcgMzuExMM=",
        kty: "RSA",
        n:
          "mg2880GUt0Eb0QefUsiHEVm8C5Vm6sKBPSniAqR5MCM9KD-QbAZEuSW0B_iVQ9-QGkblE3EIfM24cCEKOFQ86_phLpiaHckYaKDsZFFcfJox4H9pQY7wlPay0ANkHMlLyEVYHj0zWZ0geVdSu8-W-TEkn6zVDgRtfn19KU8PVsxHPC1wcec2yuT6-fr5tY64SV76Q-M1hq7LHnbidcukjcbj4sXmwHc0R6IsJZvrE9VuEUrPFbdJ257f8SxASxvpplNwEN43605_mB_aI0sQN7tH2kutZNexl-S8T2SH9Vu6hUyCjuupkLe8hyLwAPTslse_ndF2jNAlSO12IC2zEw",
        use: "sig",
      },
    ],
  };

  const jwkForIdToken = jwk.keys[0];
  const pem = jwkToPem(jwkForIdToken);
  try {
    jwt.verify(req.body.token, pem, (error, decodedToken) => {
      if (error) {
        console.log(error);
        return res.status(403).send(error);
      }
      // console.log('decoded token', decodedToken);
      req.decodedToken = decodedToken;
      next();
    });
  } catch (error) {
    return resp.status(500).send(error);
  }
}

module.exports = authorizeUser;
