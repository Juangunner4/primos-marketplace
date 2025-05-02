import * as Dialog from "@radix-ui/react-dialog";
import { motion } from "framer-motion";

type MarketplaceCardProps = {
  image: string;
  title: string;
  price: string;
};

export const MarketplaceCard = ({ image, title, price }: MarketplaceCardProps) => (
  <Dialog.Root>
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="bg-secondary rounded-2xl shadow-neon p-4 cursor-pointer"
    >
      <Dialog.Trigger asChild>
        <img
          src={image}
          alt={title}
          className="rounded-xl object-cover h-48 w-full"
        />
      </Dialog.Trigger>
      <div className="mt-4 text-white">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-primary">{price} SOL</p>
      </div>
    </motion.div>

    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 bg-black/70 z-40" />
      <Dialog.Content className="fixed top-1/2 left-1/2 bg-secondary text-white p-6 rounded-xl z-50 transform -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md shadow-neon">
        <Dialog.Title className="text-2xl font-bold">{title}</Dialog.Title>
        <img src={image} alt={title} className="mt-4 rounded-xl" />
        <p className="mt-4 text-primary font-semibold">Price: {price} SOL</p>
        <Dialog.Close className="absolute top-2 right-4 text-white text-xl">×</Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
);
