import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoaderCircle, Plus } from 'lucide-react';
import { foodAdsApi } from '../lib/api';

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  cuisineType: z.string().min(2, 'Cuisine is required'),
  brandTone: z.string().min(2, 'Tone is required'),
  websiteUrl: z.string().url('Use a valid URL').or(z.literal('')).optional(),
  logoUrl: z.string().url('Use a valid URL').or(z.literal('')).optional(),
});

type FormValues = z.infer<typeof schema>;

export function RestaurantsPage() {
  const queryClient = useQueryClient();
  const restaurants = useQuery({ queryKey: ['restaurants'], queryFn: () => foodAdsApi.listRestaurants() });
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      cuisineType: '',
      brandTone: 'premium',
      websiteUrl: '',
      logoUrl: '',
    },
  });

  const createRestaurant = useMutation({
    mutationFn: (values: FormValues) =>
      foodAdsApi.createRestaurant({
        ...values,
        websiteUrl: values.websiteUrl || null,
        logoUrl: values.logoUrl || null,
      }),
    onSuccess: async () => {
      form.reset({ name: '', cuisineType: '', brandTone: 'premium', websiteUrl: '', logoUrl: '' });
      await queryClient.invalidateQueries({ queryKey: ['restaurants'] });
    },
  });

  return (
    <div className="grid" style={{ gap: 20 }}>
      <div className="header-row">
        <div>
          <div className="muted" style={{ textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: 12 }}>
            Restaurants
          </div>
          <h2 style={{ margin: '10px 0 0', fontSize: '2rem' }}>Brand profiles</h2>
        </div>
      </div>
      <div className="card-grid">
        <form className="panel span-4" style={{ padding: 20 }} onSubmit={form.handleSubmit((values) => createRestaurant.mutate(values))}>
          <div className="form-grid">
            <div className="field">
              <label>Name</label>
              <input className="input" {...form.register('name')} />
            </div>
            <div className="field">
              <label>Cuisine</label>
              <input className="input" {...form.register('cuisineType')} />
            </div>
            <div className="field">
              <label>Brand tone</label>
              <input className="input" {...form.register('brandTone')} />
            </div>
            <div className="field">
              <label>Website</label>
              <input className="input" {...form.register('websiteUrl')} />
            </div>
            {createRestaurant.isError && <div className="alert">Could not save restaurant.</div>}
            <button className="btn btn-primary" type="submit" disabled={createRestaurant.isPending}>
              {createRestaurant.isPending ? <LoaderCircle className="spin" size={16} /> : <Plus size={16} />}
              Add restaurant
            </button>
          </div>
        </form>

        <div className="panel span-8" style={{ padding: 20 }}>
          <div style={{ display: 'grid', gap: 14 }}>
            {restaurants.isLoading && <div className="muted">Loading restaurants...</div>}
            {restaurants.isError && <div className="alert">Could not load restaurants.</div>}
            {restaurants.data?.map((restaurant) => (
              <div key={restaurant.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: 14, borderRadius: 16, background: 'rgba(255,255,255,0.04)' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{restaurant.name}</div>
                  <div className="muted">{restaurant.cuisineType}</div>
                </div>
                <div className="muted">{restaurant.brandTone}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
