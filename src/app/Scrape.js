import cheerio from "cheerio";
import fetch from "node-fetch";
import { GoogleGenerativeAI } from "@google/generative-ai";
const AI_ENDPOINT = "https://r.jina.ai/";

export default async function ScrapeData() {
  try {
    const response = await fetch("https://placementdriveinsta.in/");
    if (!response.ok) {
      throw new Error("Failed to fetch");
    }
    const html = await response.text();
    const $ = cheerio.load(html);
    const posts = [];
    const jobsdata = [];

    const sliderContainer = $(".featured-slider .owl-carousel");
    if (sliderContainer.length) {
      const postItems = sliderContainer.find(".post-item");
      const uniqueUrls = new Set();

      postItems.each((index, element) => {
        const linkElement = $(element).find(".post-img-wrap a");
        const url = linkElement.attr("href");

        const dateElement = $(element).find(".entry-meta .date a");
        const date = dateElement.text().trim();

        const batchElements = $(element).find(".cat-links a");
        const batches = batchElements
          .map((index, batch) => $(batch).text().trim())
          .get();

        if (url && date && batches.length > 0 && !uniqueUrls.has(url)) {
          uniqueUrls.add(url);
          posts.push({ url, date, batches });
        }
      });

      async function SendScrapeDataToai(url) {
        try {
          const response = await fetch(`${AI_ENDPOINT}${url}`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${process.env.JINA_KEY}`,
            },
          });
          console.log(response);
          if (!response.ok) {
            throw new Error("Failed to send data to AI endpoint");
          }

          const data = await response.text();
          jobsdata.push(data);
        } catch (error) {
          console.error("Error:", error);
        }
      }
      const genAI = new GoogleGenerativeAI(process.env.API_KEY);
      console.log(process.env.API_KEY);
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-pro",
      });
      async function run(query) {
        console.log("ins");
        const prompt = query;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const pattern = /\[.*?\]/;

        const match = jsonString.match(pattern);
      }

      async function main() {
        const postUrls = posts.map((post) => post.url);

        await Promise.all(postUrls.map((url) => SendScrapeDataToai(url)));
        console.log("completed");
        const query = `DATA : ( ${jobsdata} )
        question : please extract job information ( name , link , qualification( ( also note if there is experience
 or the skills u need or What u need or any other information about a particular job ) as JSON from the following data
       note: please remove newline characters from the result `;
      }

      main();
    } else {
      res.status(404).json({ message: "Slider container not found" });
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
