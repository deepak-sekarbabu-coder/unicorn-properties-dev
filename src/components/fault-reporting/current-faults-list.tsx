'use client';

import { useAuth } from '@/context/auth-context';

import React, { useEffect, useState } from 'react';

import Image from 'next/image';

import { deleteFault, getFaults, updateFault } from '@/lib/firestore';
import type { Fault } from '@/lib/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function CurrentFaultsList() {
  const { user } = useAuth();
  const [faults, setFaults] = useState<Fault[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchFaults = async () => {
    setLoading(true);
    try {
      const all = await getFaults();
      setFaults(all.filter(f => !f.fixed));
    } catch {
      setError('Failed to load faults');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaults();
  }, []);

  const handleMarkFixed = async (id: string) => {
    await updateFault(id, { fixed: true, fixedAt: new Date().toISOString() });
    fetchFaults();
  };
  const handleDelete = async (id: string) => {
    await deleteFault(id);
    fetchFaults();
  };

  return (
    <div className="max-w-3xl mx-auto w-full space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Current Faults</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading...</div>
          ) : error ? (
            <div className="text-red-500">{error}</div>
          ) : faults.length === 0 ? (
            <div>No current faults reported.</div>
          ) : (
            <div className="space-y-6">
              {faults.map(fault => (
                <div key={fault.id} className="border rounded-lg p-4 bg-muted">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {fault.images.map((img, i) => (
                      <Image
                        key={i}
                        src={img}
                        alt="Fault"
                        width={80}
                        height={80}
                        className="w-20 h-20 object-cover rounded border"
                      />
                    ))}
                  </div>
                  <div className="font-semibold">Location:</div>
                  <div className="mb-1">{fault.location}</div>
                  <div className="font-semibold">Description:</div>
                  <div className="mb-1">{fault.description}</div>
                  <div className="text-xs text-gray-500 mb-2">
                    Reported at: {new Date(fault.reportedAt).toLocaleString()}
                  </div>
                  {user?.role === 'admin' && (
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" onClick={() => handleMarkFixed(fault.id)}>
                        Mark as Fixed
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(fault.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
