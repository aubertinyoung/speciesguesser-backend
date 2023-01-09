const axios = require("axios");
const express = require("express");
const router = express.Router();

/* GET home page. */
// router.get("/observations", function (req, res) {
//   res.render("index", { title: "Express" });
// });

router.get("/observations", (req, res) => {
  const perPage = 10;
  const page = Math.floor(Math.random() * 999);

  async function fetchObsData() {
    const response = await axios.get(
      `https://api.inaturalist.org/v1/observations?page=${page}&per_page=${perPage}&quality_grade=research&has[]=photos&hrank=genus`
    );

    const handleObsResponse = () => {
      const data = response.data;
      const obs = data.results.find(
        (item) =>
          item["taxon"]["rank"] == "species" &&
          (item["taxon"]["preferred_common_name"] != null ||
            item["taxon"]["preferred_common_name"] != undefined)
      );

      return obs;
    };

    const dfil = await handleObsResponse();

    var arr = dfil.taxon.ancestor_ids;
    // console.log(arr);

    const getTaxon = async (arr) => {
      var vals = [];
      const per_page = 10;
      // for (let i = 0; i < arr.length; i++) {
      let i = 0;
      while (
        typeof k != "number" ||
        typeof f != "number" ||
        typeof g != "number"
      ) {
        const resp = await axios.get(
          `https://api.inaturalist.org/v1/taxa?taxon_id=${arr[i]}&per_page=${per_page}`
        );
        // console.log(resp.data);
        // break;
        if ((resp.data.results[0].rank == "kingdom") & (typeof k != "number")) {
          vals.push({ kingdom: resp.data.results[0].id });
          var k = 1;
        } else if (
          (resp.data.results[0].rank == "family") &
          (typeof f != "number")
        ) {
          vals.push({ family: resp.data.results[0].id });
          var f = 1;
        } else if (
          (resp.data.results[0].rank == "genus") &
          (typeof g != "number")
        ) {
          vals.push({ genus: resp.data.results[0].id });
          var g = 1;
        }
        //
        i++;
        // console.log(vals);
      }
      return Object.assign({}, vals[0], vals[1], vals[2]);
    };

    const phylo = await getTaxon(arr);

    const spdata = {
      sciName: dfil["taxon"]["name"],
      comName: dfil["taxon"]["preferred_common_name"],
      phylo: phylo,
      photo: dfil["taxon"]["default_photo"]["medium_url"],
      place: dfil["place_guess"],
      observedOn: dfil["observed_on"],
      observedBy: {
        name: dfil["user"]["name"],
        login: dfil["user"]["login"],
      },
    };

    res.json(spdata);
  }

  fetchObsData();
});

router.get("/alternateAnswers", async (req, res) => {
  const perPage = 50;
  const page = Math.floor(Math.random() * 199);
  const taxonID = req.params.taxonID ? req.params.taxonID : 1;

  console.log("message received!");
  console.log(taxonID);

  await axios
    .get(
      `https://api.inaturalist.org/v1/taxa?page=${page}&per_page=${perPage}&rank=species&taxon_id=${[
        taxonID,
      ]}`
    )
    .then((data) => {
      console.log(data.data);
      const d = data["data"];

      sciNames = [];
      comNames = [];

      const dfil = d["results"].filter((item) => {
        return (
          item.preferred_common_name !== null ||
          item.preferred_common_name !== ""
        );
      });

      let i = 1;
      while (comNames.length < 3) {
        let cname = dfil[i]["preferred_common_name"];
        if (cname == null || cname == "" || cname == undefined) {
          break;
        } else {
          comNames.push(cname);
          sciNames.push(d["results"][i]["name"]);
        }

        i++;
      }

      altspp = {
        sciNames: sciNames,
        comNames: comNames,
      };

      res.json(altspp);
    });
});

module.exports = router;
