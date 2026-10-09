// المحتوى الحالي للموقع (نسخة احتياطية + بيتستورد على Firebase بزرار من لوحة الأدمن)
export const SEED = {
  "stages": [
    {
      "id": "prep1",
      "level": "prep",
      "title": "الصف الأول الإعدادي",
      "description": "شرح شامل + مراجعة + أسئلة محلولة",
      "bookUrl": "https://drive.google.com/file/d/1IOues5lp4ObTtetvsNgutaVyK9Dea4_K/view?usp=drive_link",
      "order": 1
    },
    {
      "id": "prep2",
      "level": "prep",
      "title": "الصف الثاني الإعدادي",
      "description": "شرح شامل + مراجعة + أسئلة محلولة",
      "bookUrl": "https://drive.google.com/file/d/1gleQOz04WgNlZTrRfFMMC7H8fXxC4tNl/view?usp=drive_link",
      "order": 2
    },
    {
      "id": "prep3",
      "level": "prep",
      "title": "الصف الثالث الإعدادي",
      "description": "شرح شامل + مراجعة + أسئلة محلولة",
      "bookUrl": "https://drive.google.com/file/d/1iWkCajhhDMYCop28AAu2YWYvxyw0daJh/view?usp=drive_link",
      "order": 3
    }
  ],
  "units": [
    {
      "id": "prep1-u1",
      "stageId": "prep1",
      "title": "Unit 1",
      "order": 1
    },
    {
      "id": "prep2-u1",
      "stageId": "prep2",
      "title": "Unit 1",
      "order": 1
    },
    {
      "id": "prep3-u1",
      "stageId": "prep3",
      "title": "Unit 1",
      "order": 1
    }
  ],
  "series": [
    {
      "id": "comparisons",
      "title": "سلسلة المقارنات",
      "description": "سلسلة فيديوهات بتشرح الفرق بين القواعد والكلمات المتشابهة في المعنى أو النطق عشان تساعدك تختار القاعدة أو الكلمة الصح في كل موقف.",
      "pageTitle": "اعرف الفرق ومتتلغبطش تاني",
      "order": 1
    }
  ],
  "videos": [
    {
      "id": "prep1-u1-explain",
      "stageId": "prep1",
      "unitId": "prep1-u1",
      "kind": "explain",
      "title": "",
      "description": "",
      "url": "https://youtu.be/zssQ7k1xyL8?si=Gj9fj11kRnx7nnFL",
      "order": 1
    },
    {
      "id": "prep2-u1-explain",
      "stageId": "prep2",
      "unitId": "prep2-u1",
      "kind": "explain",
      "title": "",
      "description": "",
      "url": "https://youtu.be/aRM0fg_BA0k?si=GccAw9aOAwF7VKah",
      "order": 1
    },
    {
      "id": "prep3-u1-explain",
      "stageId": "prep3",
      "unitId": "prep3-u1",
      "kind": "explain",
      "title": "",
      "description": "",
      "url": "https://youtu.be/wP2rvhH0QgU?si=bfv1hIZdC-XNLpZ9",
      "order": 1
    },
    {
      "id": "comparisons-1",
      "seriesId": "comparisons",
      "title": "For و Since",
      "description": "",
      "url": "https://youtu.be/uJvqglNk-RQ",
      "order": 1
    },
    {
      "id": "comparisons-2",
      "seriesId": "comparisons",
      "title": "Many و Much",
      "description": "",
      "url": "https://youtu.be/1dMPL7tzDc4",
      "order": 2
    },
    {
      "id": "comparisons-3",
      "seriesId": "comparisons",
      "title": "used to و be used to و get used to",
      "description": "",
      "url": "https://youtu.be/h5xKarKO-Ms",
      "order": 3
    },
    {
      "id": "comparisons-4",
      "seriesId": "comparisons",
      "title": "Comparatives و Superlatives",
      "description": "",
      "url": "https://youtu.be/xBfWGYaQ2_E",
      "order": 4
    },
    {
      "id": "comparisons-5",
      "seriesId": "comparisons",
      "title": "Talk و Speak",
      "description": "",
      "url": "https://youtu.be/I8-kLdv2O8c?si=rMOFxTrF705qftF2",
      "order": 5
    },
    {
      "id": "comparisons-6",
      "seriesId": "comparisons",
      "title": "Say و Tell",
      "description": "",
      "url": "https://youtu.be/kLK-tA9cQiA?si=2cHlyi88FcG4dlow",
      "order": 6
    },
    {
      "id": "comparisons-7",
      "seriesId": "comparisons",
      "title": "Do و Make",
      "description": "",
      "url": "https://youtu.be/e7dYcOUnWWI?si=EfdK11V3YAP5u6VA",
      "order": 7
    },
    {
      "id": "comparisons-8",
      "seriesId": "comparisons",
      "title": "Affect و Effect",
      "description": "",
      "url": "https://youtu.be/Tmgc2tNSsBs?si=mX54ebMnZovOV3H9",
      "order": 8
    },
    {
      "id": "comparisons-9",
      "seriesId": "comparisons",
      "title": "Beside و Bsides",
      "description": "",
      "url": "https://youtu.be/nDZ0TM0K-vY?si=UASQRfVBv5zB4dGy",
      "order": 9
    },
    {
      "id": "comparisons-10",
      "seriesId": "comparisons",
      "title": "Rise و Raise",
      "description": "",
      "url": "https://youtu.be/kv7MdJudSyw?si=91vSNplnssQVTvxS",
      "order": 10
    },
    {
      "id": "comparisons-11",
      "seriesId": "comparisons",
      "title": "Each و Every",
      "description": "",
      "url": "https://youtu.be/OLHMoT44JL0?si=AAFSgpZ5rzXr9yfG",
      "order": 11
    },
    {
      "id": "comparisons-12",
      "seriesId": "comparisons",
      "title": "Sensitive و Sensible",
      "description": "",
      "url": "https://youtu.be/wJDfRfKuo-g?si=jPug_nWTpIvwyp6Q",
      "order": 12
    },
    {
      "id": "comparisons-13",
      "seriesId": "comparisons",
      "title": "During و While",
      "description": "",
      "url": "https://youtu.be/Oxs3JzLuMgM?si=G-zjAhL9CjBi-Kof",
      "order": 13
    }
  ]
};
