import { Card } from '@/components/ui/card';
import { Play, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AddToPlaylistDialog from './AddToPlaylistDialog';
import { Button } from './ui/button';

interface VideoCardProps {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  views: number;
  teacherName?: string;
  createdAt: string;
}

const VideoCard = ({ id, title, description, thumbnailUrl, views, teacherName, createdAt }: VideoCardProps) => {
  const navigate = useNavigate();

  return (
    <Card 
      className="glass-card overflow-hidden cursor-pointer group transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_hsl(var(--primary)/0.3)]"
      onClick={() => navigate(`/watch/${id}`)}
    >
      <div className="relative aspect-video bg-muted overflow-hidden">
        {thumbnailUrl ? (
          <img 
            src={thumbnailUrl} 
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
            <Play className="h-16 w-16 text-primary" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
          <Play className="h-12 w-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {description}
          </p>
        )}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <div className="flex items-center space-x-1">
            <Eye className="h-3 w-3" />
            <span>{views} views</span>
          </div>
          {teacherName && (
            <span className="text-primary">{teacherName}</span>
          )}
        </div>
        <div className="text-xs text-muted-foreground mb-3">
          {new Date(createdAt).toLocaleDateString()}
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          <AddToPlaylistDialog 
            videoId={id}
            trigger={
              <Button variant="outline" size="sm" className="w-full">
                <Play className="h-3 w-3 mr-2" />
                Add to Playlist
              </Button>
            }
          />
        </div>
      </div>
    </Card>
  );
};

export default VideoCard;
