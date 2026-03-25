// pages/api/locations/index.ts

import { prisma } from '@/lib/prisma';
// import { NextApiRequest, NextApiResponse } from 'next';
import { NextRequest, NextResponse } from 'next/server';

// Define the response structure
interface LocationResponse {
  [city: string]: string[];  // City -> List of Areas
}



// export async function POST(req: Request) {
//   try {
//     // Parse the incoming JSON request body
//     const { email, password } = await req.json();
//     console.log('Request Body:', { email, password });

//     // Check if both email and password are provided
//     if (!email || !password) {
//       return new Response(
//         JSON.stringify({ error: 'Email and password are required.' }),
//         { status: 400 }
//       );
//     }

//     // Authenticate with Supabase
//     const { data: supabaseUser, error: supabaseError } = await supabase.auth.signInWithPassword({
//       email,
//       password,
//     });

//     if (supabaseError) {
//       console.error('Supabase Authentication Error:', supabaseError.message);

//       // Return a 401 Unauthorized response if credentials are invalid
//       if (supabaseError.message?.toLowerCase().includes('invalid')) {
//         return new Response(
//           JSON.stringify({ error: 'Invalid email or password.' }),
//           { status: 401 }
//         );
//       }

//       // Handle other potential errors
//       return new Response(
//         JSON.stringify({ error: supabaseError.message }),
//         { status: 500 }
//       );
//     }
//     // Get complete user data with role-specific profiles
//     const userInDb = await prisma.user.findUnique({
//       where: { email: email },
//       include: {
//         vendorProfile: true,
//         driver: true,
//       }
//     });

//     if (!userInDb) {
//       console.error('User not found in Prisma DB:', email);
//       return new Response(
//         JSON.stringify({ error: 'User not found in the database.' }),
//         { status: 404 }
//       );
//     }

//     // If everything is fine, set cookies and return complete user data
//     return new Response(
//       JSON.stringify({
//         data: {
//           ...supabaseUser,
//           user: {
//             ...userInDb,
//             role: userInDb.role,
//             approvalStatus: userInDb.approvalStatus,
//             // Only include relevant profile based on role
//             ...(userInDb.role === 'VENDOR' ? { vendorProfile: userInDb.vendorProfile } : {}),
//             ...(userInDb.role === 'DRIVER' ? { driver: userInDb.driver } : {})
//           }
//         },
//         message: 'Login successful!',
//       }),
//       {
//         status: 200,
//         headers: {
//           'Set-Cookie': `sb-access-token=${supabaseUser.session?.access_token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600`
//         }
//       }
//     );
//   } catch (error) {
//     console.error('Unexpected Error:', error);
//     return new Response(
//       JSON.stringify({ error: 'Something went wrong. Please try again later.' }),
//       { status: 500 }
//     );
//   }
// }



export async function GET(req: NextRequest) {
    try {
      // Fetch distinct cities and areas from the restaurant model
      const locations = await prisma.restaurant.findMany({
        select: {
          city: true,
          area: true,
        },
        distinct: ['city', 'area'],
      });
  
      // Organize the data into the required structure
      const cityAreaMap: LocationResponse = {};
  
      locations.forEach((restaurant) => {
        if (!cityAreaMap[restaurant.city]) {
          cityAreaMap[restaurant.city] = [];
        }
        if (!cityAreaMap[restaurant.city].includes(restaurant.area)) {
          cityAreaMap[restaurant.city].push(restaurant.area);
        }
      });
  
      // Return the response with the cities and areas map
      return NextResponse.json(cityAreaMap);
    } catch (error) {
      console.error(error);
      return NextResponse.json({ message: 'Error fetching locations' }, { status: 500 });
    }
  }