"use client";

import { ChangeEvent, FormEvent, useState } from "react";

type PreviewImage = {
  name: string;
  url: string;
};

type LocalReview = {
  rating: number;
  title: string;
  body: string;
  images: PreviewImage[];
};

export default function ReviewUploadForm() {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [images, setImages] = useState<PreviewImage[]>([]);
  const [localReviews, setLocalReviews] = useState<LocalReview[]>([]);

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []).slice(0, 4);

    Promise.all(
      files.map(
        (file) =>
          new Promise<PreviewImage>((resolve) => {
            const reader = new FileReader();

            reader.onload = () => {
              resolve({
                name: file.name,
                url: String(reader.result || ""),
              });
            };

            reader.readAsDataURL(file);
          })
      )
    ).then((nextImages) => setImages(nextImages));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!body.trim()) {
      return;
    }

    setLocalReviews((currentReviews) => [
      {
        rating,
        title: title.trim() || "Customer review",
        body: body.trim(),
        images,
      },
      ...currentReviews,
    ]);
    setRating(5);
    setTitle("");
    setBody("");
    setImages([]);
  };

  return (
    <div className="mb-7 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-950">Write a review</h2>
          <p className="mt-1 text-sm text-slate-600">Add your review and images.</p>
        </div>
        <div className="flex gap-1" aria-label={`${rating} out of 5 stars`}>
          {Array.from({ length: 5 }).map((_, index) => {
            const starValue = index + 1;

            return (
              <button
                key={starValue}
                type="button"
                aria-label={`${starValue} star`}
                onClick={() => setRating(starValue)}
                className={`text-2xl transition ${
                  starValue <= rating ? "text-amber-400" : "text-slate-300"
                }`}
              >
                ★
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="review-title" className="text-sm font-bold text-slate-700">
            Review title
          </label>
          <input
            id="review-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Great quality for the price"
            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:ring-4 focus:ring-teal-50"
          />
        </div>

        <div>
          <label htmlFor="review-body" className="text-sm font-bold text-slate-700">
            Long review
          </label>
          <textarea
            id="review-body"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Share what you liked, what could be better, and how the product worked for you."
            rows={7}
            className="mt-2 min-h-44 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm leading-6 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:ring-4 focus:ring-teal-50"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-teal-300 hover:text-teal-700">
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 16V4m0 0 4 4m-4-4-4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
              />
            </svg>
            Upload images
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="sr-only"
            />
          </label>

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-teal-100"
          >
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m5 12 4 4L19 6" />
            </svg>
            Add review
          </button>
        </div>

        {images.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {images.map((image) => (
              <div
                key={image.name}
                className="overflow-hidden rounded-lg border border-slate-200 bg-white"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.url}
                  alt={image.name}
                  className="h-24 w-full object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </form>

      {localReviews.length > 0 && (
        <div className="mt-5 space-y-3 border-t border-slate-200 pt-5">
          {localReviews.map((review, index) => (
            <article key={`${review.title}-${index}`} className="rounded-lg bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-bold text-slate-950">{review.title}</h3>
                <div className="text-sm font-bold text-amber-500">
                  {"★".repeat(review.rating)}
                  <span className="text-slate-300">
                    {"★".repeat(5 - review.rating)}
                  </span>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">
                {review.body}
              </p>
              {review.images.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {review.images.map((image) => (
                    <div
                      key={image.name}
                      className="overflow-hidden rounded-lg border border-slate-100"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image.url}
                        alt={image.name}
                        className="h-24 w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
